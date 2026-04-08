import { TwoFactorService } from './two-factor.service';
import { Enable2faDto, VerifyTotpSetupDto, Disable2faDto } from './dto/enable-2fa.dto';
export declare class TwoFactorController {
    private readonly twoFactorService;
    constructor(twoFactorService: TwoFactorService);
    getStatus(userId: string): Promise<{
        enabled: boolean;
        method: import("@prisma/client").$Enums.TwoFactorMethod | null;
        remainingRecoveryCodes: number;
    }>;
    setup(userId: string, enable2faDto: Enable2faDto): Promise<{
        secret: string;
        qrCode: string;
        message: string;
    } | {
        message: string;
        recoveryCodes: string[];
        warning: string;
    } | undefined>;
    verifyTotpSetup(userId: string, verifyDto: VerifyTotpSetupDto): Promise<{
        message: string;
        recoveryCodes: string[];
        warning: string;
    }>;
    sendEmailOtp(userId: string): Promise<{
        message: string;
        expiresInMinutes: number;
    }>;
    regenerateRecoveryCodes(userId: string, password: string): Promise<{
        recoveryCodes: string[];
        warning: string;
    }>;
    disable(userId: string, disable2faDto: Disable2faDto): Promise<{
        message: string;
    }>;
}
