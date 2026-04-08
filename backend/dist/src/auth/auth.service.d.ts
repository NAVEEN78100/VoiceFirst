import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly userService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly MAX_LOGIN_ATTEMPTS;
    private readonly LOCKOUT_DURATION_MINUTES;
    private readonly TEMP_TOKEN_EXPIRY_MINUTES;
    constructor(prisma: PrismaService, userService: UserService, jwtService: JwtService, configService: ConfigService);
    login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto>;
    verify2fa(verify2faDto: Verify2faDto): Promise<AuthResponseDto>;
    private generateJwt;
    private createTempAuthToken;
    private verifyTotp;
    private verifyEmailOtp;
    private verifyRecoveryCode;
    private checkLoginAttempts;
    private recordLoginAttempt;
}
