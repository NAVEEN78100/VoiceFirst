import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { Verify2faDto, VerificationMethod } from './dto/verify-2fa.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly TEMP_TOKEN_EXPIRY_MINUTES = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main login flow
   */
  async login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    const email = loginDto.email.toLowerCase().trim();

    // Check rate limiting (brute force protection)
    await this.checkLoginAttempts(email, ipAddress);

    // Find user
    const user = await this.userService.findByEmail(email);

    if (!user) {
      await this.recordLoginAttempt(email, null, ipAddress, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated. Contact an administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      await this.recordLoginAttempt(email, user.id, ipAddress, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Record successful credential validation
    await this.recordLoginAttempt(email, user.id, ipAddress, true);

    // Check 2FA
    if (user.twoFactorEnabled) {
      const tempToken = await this.createTempAuthToken(user.id);

      return {
        requiresTwoFactor: true,
        tempToken,
        twoFactorMethod: user.twoFactorMethod || 'TOTP',
      };
    }

    // No 2FA — issue JWT directly
    await this.userService.updateLastLogin(user.id);
    const accessToken = this.generateJwt(user.id, user.role);

    return {
      accessToken,
      requiresTwoFactor: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  /**
   * Verify 2FA and issue final JWT
   */
  async verify2fa(verify2faDto: Verify2faDto): Promise<AuthResponseDto> {
    // Validate temp token
    const tempAuth = await this.prisma.tempAuthToken.findUnique({
      where: { token: verify2faDto.tempToken },
      include: { user: true },
    });

    if (!tempAuth || tempAuth.used || tempAuth.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Invalid or expired temporary authentication token',
      );
    }

    const user = tempAuth.user;

    // Verify based on method
    let isValid = false;

    switch (verify2faDto.method) {
      case VerificationMethod.TOTP:
        isValid = await this.verifyTotp(user.id, verify2faDto.code);
        break;
      case VerificationMethod.EMAIL:
        isValid = await this.verifyEmailOtp(user.id, verify2faDto.code);
        break;
      case VerificationMethod.RECOVERY_CODE:
        isValid = await this.verifyRecoveryCode(user.id, verify2faDto.code);
        break;
      default:
        throw new UnauthorizedException('Invalid verification method');
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Mark temp token as used ONLY IF valid
    await this.prisma.tempAuthToken.update({
      where: { id: tempAuth.id },
      data: { used: true },
    });

    // Issue final JWT
    await this.userService.updateLastLogin(user.id);
    const accessToken = this.generateJwt(user.id, user.role);

    return {
      accessToken,
      requiresTwoFactor: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  /**
   * Generate JWT token
   */
  private generateJwt(userId: string, role: string): string {
    const payload: JwtPayload = {
      sub: userId,
      role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Create a temporary auth token for 2FA flow
   */
  private async createTempAuthToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + this.TEMP_TOKEN_EXPIRY_MINUTES,
    );

    await this.prisma.tempAuthToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  private async verifyTotp(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) return false;

    // Decrypt the stored TOTP secret
    const encryptionKey = this.configService.get<string>('TOTP_ENCRYPTION_KEY');
    const CryptoJS = require('crypto-js');
    const decryptedSecret = CryptoJS.AES.decrypt(
      user.totpSecret,
      encryptionKey,
    ).toString(CryptoJS.enc.Utf8);

    // Verify using otplib with a drift buffer
    const { authenticator } = require('@otplib/preset-default');
    authenticator.options = { window: 1 };
    return authenticator.verify({ token: code, secret: decryptedSecret });
  }

  /**
   * Verify email OTP
   */
  private async verifyEmailOtp(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const otp = await this.prisma.emailOtp.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    // Compare hashed code
    const isValid = await bcrypt.compare(code, otp.code);

    if (isValid) {
      await this.prisma.emailOtp.update({
        where: { id: otp.id },
        data: { used: true },
      });
    }

    return isValid;
  }

  /**
   * Verify recovery code
   */
  private async verifyRecoveryCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const recoveryCodes = await this.prisma.recoveryCode.findMany({
      where: { userId, used: false },
    });

    for (const rc of recoveryCodes) {
      const isValid = await bcrypt.compare(code, rc.code);
      if (isValid) {
        await this.prisma.recoveryCode.update({
          where: { id: rc.id },
          data: { used: true, usedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has exceeded login attempts
   */
  private async checkLoginAttempts(
    email: string,
    ipAddress?: string,
  ): Promise<void> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - this.LOCKOUT_DURATION_MINUTES);

    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { gt: since },
      },
    });

    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      this.logger.warn(`Account locked due to too many failed attempts: ${email}`);
      throw new ForbiddenException(
        `Account temporarily locked. Too many failed login attempts. Try again in ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
      );
    }
  }

  /**
   * Record a login attempt for auditing and brute force protection
   */
  private async recordLoginAttempt(
    email: string,
    userId: string | null,
    ipAddress?: string,
    success: boolean = false,
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email,
        userId,
        ipAddress: ipAddress || null,
        success,
      },
    });
  }
}
