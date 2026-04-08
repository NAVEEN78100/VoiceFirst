import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class TwoFactorService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly SALT_ROUNDS;
    private readonly encryptionKey;
    private readonly otpExpiryMinutes;
    private readonly recoveryCodesCount;
    constructor(prisma: PrismaService, configService: ConfigService);
    generateTotpSecret(userId: string): Promise<{
        secret: string;
        qrCode: string;
        message: string;
    }>;
    verifyAndEnableTotp(userId: string, code: string): Promise<{
        message: string;
        recoveryCodes: string[];
        warning: string;
    }>;
    generateEmailOtp(userId: string): Promise<{
        message: string;
        expiresInMinutes: number;
    }>;
    enableEmail2fa(userId: string): Promise<{
        message: string;
        recoveryCodes: string[];
        warning: string;
    }>;
    generateRecoveryCodes(userId: string): Promise<string[]>;
    regenerateRecoveryCodes(userId: string, password: string): Promise<string[]>;
    disable2fa(userId: string, password: string): Promise<{
        message: string;
    }>;
    get2faStatus(userId: string): Promise<{
        enabled: boolean;
        method: import("@prisma/client").$Enums.TwoFactorMethod | null;
        remainingRecoveryCodes: number;
    }>;
    private maskEmail;
}
