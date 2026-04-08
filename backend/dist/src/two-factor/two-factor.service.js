"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TwoFactorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const CryptoJS = __importStar(require("crypto-js"));
const QRCode = __importStar(require("qrcode"));
const preset_default_1 = require("@otplib/preset-default");
const prisma_service_1 = require("../prisma/prisma.service");
let TwoFactorService = TwoFactorService_1 = class TwoFactorService {
    prisma;
    configService;
    logger = new common_1.Logger(TwoFactorService_1.name);
    SALT_ROUNDS = 12;
    encryptionKey;
    otpExpiryMinutes;
    recoveryCodesCount;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.encryptionKey = this.configService.get('TOTP_ENCRYPTION_KEY', 'default-encryption-key-change-me!!');
        this.otpExpiryMinutes = this.configService.get('OTP_EXPIRY_MINUTES', 5);
        this.recoveryCodesCount = this.configService.get('RECOVERY_CODES_COUNT', 10);
    }
    async generateTotpSecret(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.twoFactorEnabled) {
            throw new common_1.BadRequestException('Two-factor authentication is already enabled');
        }
        const secret = preset_default_1.authenticator.generateSecret();
        const otpauthUrl = preset_default_1.authenticator.keyuri(user.email, 'VoiceFirst', secret);
        const encryptedSecret = CryptoJS.AES.encrypt(secret, this.encryptionKey).toString();
        await this.prisma.user.update({
            where: { id: userId },
            data: { totpSecret: encryptedSecret },
        });
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
        return {
            secret,
            qrCode: qrCodeDataUrl,
            message: 'Scan the QR code with your authenticator app, then verify with a code',
        };
    }
    async verifyAndEnableTotp(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpSecret) {
            throw new common_1.BadRequestException('TOTP setup not initiated. Generate a secret first.');
        }
        const decryptedSecret = CryptoJS.AES.decrypt(user.totpSecret, this.encryptionKey).toString(CryptoJS.enc.Utf8);
        preset_default_1.authenticator.options = { window: 1 };
        const isValid = preset_default_1.authenticator.verify({
            token: code,
            secret: decryptedSecret,
        });
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid TOTP code. Please try again.');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorMethod: 'TOTP',
            },
        });
        const recoveryCodes = await this.generateRecoveryCodes(userId);
        this.logger.log(`2FA (TOTP) enabled for user: ${user.email}`);
        return {
            message: 'Two-factor authentication enabled successfully',
            recoveryCodes,
            warning: 'Save these recovery codes in a safe place. They will not be shown again.',
        };
    }
    async generateEmailOtp(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = await bcrypt.hash(otp, this.SALT_ROUNDS);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiryMinutes);
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
        this.logger.log(`Email OTP generated for ${user.email}: ${otp}`);
        return {
            message: `A verification code has been sent to ${this.maskEmail(user.email)}`,
            expiresInMinutes: this.otpExpiryMinutes,
        };
    }
    async enableEmail2fa(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.twoFactorEnabled) {
            throw new common_1.BadRequestException('Two-factor authentication is already enabled');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorMethod: 'EMAIL',
            },
        });
        const recoveryCodes = await this.generateRecoveryCodes(userId);
        this.logger.log(`2FA (EMAIL) enabled for user: ${user.email}`);
        return {
            message: 'Email-based two-factor authentication enabled successfully',
            recoveryCodes,
            warning: 'Save these recovery codes in a safe place. They will not be shown again.',
        };
    }
    async generateRecoveryCodes(userId) {
        await this.prisma.recoveryCode.deleteMany({ where: { userId } });
        const codes = [];
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
    async regenerateRecoveryCodes(userId, password) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid password');
        }
        if (!user.twoFactorEnabled) {
            throw new common_1.BadRequestException('Two-factor authentication is not enabled');
        }
        return this.generateRecoveryCodes(userId);
    }
    async disable2fa(userId, password) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid password');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorMethod: null,
                totpSecret: null,
            },
        });
        await this.prisma.recoveryCode.deleteMany({ where: { userId } });
        await this.prisma.emailOtp.deleteMany({ where: { userId } });
        await this.prisma.tempAuthToken.deleteMany({ where: { userId } });
        this.logger.log(`2FA disabled for user: ${user.email}`);
        return { message: 'Two-factor authentication has been disabled' };
    }
    async get2faStatus(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const remainingCodes = await this.prisma.recoveryCode.count({
            where: { userId, used: false },
        });
        return {
            enabled: user.twoFactorEnabled,
            method: user.twoFactorMethod,
            remainingRecoveryCodes: user.twoFactorEnabled ? remainingCodes : 0,
        };
    }
    maskEmail(email) {
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
            : `${local[0]}*`;
        return `${maskedLocal}@${domain}`;
    }
};
exports.TwoFactorService = TwoFactorService;
exports.TwoFactorService = TwoFactorService = TwoFactorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], TwoFactorService);
//# sourceMappingURL=two-factor.service.js.map