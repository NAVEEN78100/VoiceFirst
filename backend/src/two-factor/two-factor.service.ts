import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';
import * as QRCode from 'qrcode';
import { authenticator } from '@otplib/preset-default';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorSetupMethod } from './dto/enable-2fa.dto';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly encryptionKey: string;
  private readonly otpExpiryMinutes: number;
  private readonly recoveryCodesCount: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('TOTP_ENCRYPTION_KEY', 'default-encryption-key-change-me!!');
    this.otpExpiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 5);
    this.recoveryCodesCount = this.configService.get<number>('RECOVERY_CODES_COUNT', 10);
  }

  // ─── TOTP (Authenticator App) ──────────────────────────────────

  /**
   * Generate TOTP secret and QR code for setup
   */
  async generateTotpSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'VoiceFirst',
      secret,
    );

    // Encrypt and temporarily store the secret
    const encryptedSecret = CryptoJS.AES.encrypt(
      secret,
      this.encryptionKey,
    ).toString();

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: encryptedSecret },
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret, // Show once for manual entry
      qrCode: qrCodeDataUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    };
  }

  /**
   * Verify TOTP code and enable 2FA
   */
  async verifyAndEnableTotp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new BadRequestException('TOTP setup not initiated. Generate a secret first.');
    }

    // Decrypt secret
    const decryptedSecret = CryptoJS.AES.decrypt(
      user.totpSecret,
      this.encryptionKey,
    ).toString(CryptoJS.enc.Utf8);

    // Give a buffer window to allow slightly expired codes
    authenticator.options = { window: 1 };

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: decryptedSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code. Please try again.');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: 'TOTP',
      },
    });

    // Generate recovery codes
    const recoveryCodes = await this.generateRecoveryCodes(userId);

    this.logger.log(`2FA (TOTP) enabled for user: ${user.email}`);

    return {
      message: 'Two-factor authentication enabled successfully',
      recoveryCodes, // Show only once!
      warning: 'Save these recovery codes in a safe place. They will not be shown again.',
    };
  }

  // ─── Email OTP ──────────────────────────────────────────────────

  /**
   * Generate and send email OTP
   */
  async generateEmailOtp(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash and store
    const hashedOtp = await bcrypt.hash(otp, this.SALT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiryMinutes);

    // Invalidate previous unused OTPs
    await this.prisma.emailOtp.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    await this.prisma.emailOtp.create({
      data: {
        userId,
        code: hashedOtp,
        expiresAt,
      },
    });

    // In production, send via email service
    // For now, log it (replace with actual email sending)
    this.logger.log(`Email OTP generated for ${user.email}: ${otp}`);

    // TODO: Integrate actual email sending via nodemailer
    // await this.sendOtpEmail(user.email, otp);

    return {
      message: `A verification code has been sent to ${this.maskEmail(user.email)}`,
      expiresInMinutes: this.otpExpiryMinutes,
    };
  }

  /**
   * Enable email-based 2FA
   */
  async enableEmail2fa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: 'EMAIL',
      },
    });

    // Generate recovery codes
    const recoveryCodes = await this.generateRecoveryCodes(userId);

    this.logger.log(`2FA (EMAIL) enabled for user: ${user.email}`);

    return {
      message: 'Email-based two-factor authentication enabled successfully',
      recoveryCodes,
      warning: 'Save these recovery codes in a safe place. They will not be shown again.',
    };
  }

  // ─── Recovery Codes ─────────────────────────────────────────────

  /**
   * Generate a set of single-use recovery codes
   */
  async generateRecoveryCodes(userId: string): Promise<string[]> {
    // Delete any existing recovery codes
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });

    const codes: string[] = [];

    for (let i = 0; i < this.recoveryCodesCount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;
      codes.push(formattedCode);

      const hashedCode = await bcrypt.hash(formattedCode, this.SALT_ROUNDS);
      await this.prisma.recoveryCode.create({
        data: {
          userId,
          code: hashedCode,
        },
      });
    }

    return codes;
  }

  /**
   * Regenerate recovery codes (requires re-authentication)
   */
  async regenerateRecoveryCodes(
    userId: string,
    password: string,
  ): Promise<string[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    return this.generateRecoveryCodes(userId);
  }

  // ─── Disable 2FA ────────────────────────────────────────────────

  /**
   * Disable 2FA (requires password confirmation)
   */
  async disable2fa(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Disable 2FA and clean up
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        totpSecret: null,
      },
    });

    // Clean up recovery codes and OTPs
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });
    await this.prisma.emailOtp.deleteMany({ where: { userId } });
    await this.prisma.tempAuthToken.deleteMany({ where: { userId } });

    this.logger.log(`2FA disabled for user: ${user.email}`);

    return { message: 'Two-factor authentication has been disabled' };
  }

  // ─── Status ─────────────────────────────────────────────────────

  /**
   * Get 2FA status for a user
   */
  async get2faStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const remainingCodes = await this.prisma.recoveryCode.count({
      where: { userId, used: false },
    });

    return {
      enabled: user.twoFactorEnabled,
      method: user.twoFactorMethod,
      remainingRecoveryCodes: user.twoFactorEnabled ? remainingCodes : 0,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal =
      local.length > 2
        ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
        : `${local[0]}*`;
    return `${maskedLocal}@${domain}`;
  }
}
