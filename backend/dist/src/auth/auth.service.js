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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const verify_2fa_dto_1 = require("./dto/verify-2fa.dto");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    userService;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    MAX_LOGIN_ATTEMPTS = 5;
    LOCKOUT_DURATION_MINUTES = 15;
    TEMP_TOKEN_EXPIRY_MINUTES = 5;
    constructor(prisma, userService, jwtService, configService) {
        this.prisma = prisma;
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(loginDto, ipAddress) {
        const email = loginDto.email.toLowerCase().trim();
        await this.checkLoginAttempts(email, ipAddress);
        const user = await this.userService.findByEmail(email);
        if (!user) {
            await this.recordLoginAttempt(email, null, ipAddress, false);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Account is deactivated. Contact an administrator.');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            await this.recordLoginAttempt(email, user.id, ipAddress, false);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.recordLoginAttempt(email, user.id, ipAddress, true);
        if (user.twoFactorEnabled) {
            const tempToken = await this.createTempAuthToken(user.id);
            return {
                requiresTwoFactor: true,
                mustResetPassword: user.mustResetPassword,
                mustSetup2fa: false,
                tempToken,
                twoFactorMethod: user.twoFactorMethod || 'TOTP',
            };
        }
        await this.userService.updateLastLogin(user.id);
        const accessToken = this.generateJwt(user.id, user.role);
        return {
            accessToken,
            requiresTwoFactor: false,
            mustResetPassword: user.mustResetPassword,
            mustSetup2fa: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
            },
        };
    }
    async verify2fa(verify2faDto) {
        const tempAuth = await this.prisma.tempAuthToken.findUnique({
            where: { token: verify2faDto.tempToken },
            include: { user: true },
        });
        if (!tempAuth || tempAuth.used || tempAuth.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired temporary authentication token');
        }
        const user = tempAuth.user;
        let isValid = false;
        switch (verify2faDto.method) {
            case verify_2fa_dto_1.VerificationMethod.TOTP:
                isValid = await this.verifyTotp(user.id, verify2faDto.code);
                break;
            case verify_2fa_dto_1.VerificationMethod.EMAIL:
                isValid = await this.verifyEmailOtp(user.id, verify2faDto.code);
                break;
            case verify_2fa_dto_1.VerificationMethod.RECOVERY_CODE:
                isValid = await this.verifyRecoveryCode(user.id, verify2faDto.code);
                break;
            default:
                throw new common_1.UnauthorizedException('Invalid verification method');
        }
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        await this.prisma.tempAuthToken.update({
            where: { id: tempAuth.id },
            data: { used: true },
        });
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
    generateJwt(userId, role) {
        const payload = {
            sub: userId,
            role,
        };
        return this.jwtService.sign(payload);
    }
    async createTempAuthToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.TEMP_TOKEN_EXPIRY_MINUTES);
        await this.prisma.tempAuthToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
        return token;
    }
    async verifyTotp(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.totpSecret)
            return false;
        const encryptionKey = this.configService.get('TOTP_ENCRYPTION_KEY');
        const CryptoJS = require('crypto-js');
        const decryptedSecret = CryptoJS.AES.decrypt(user.totpSecret, encryptionKey).toString(CryptoJS.enc.Utf8);
        const { authenticator } = require('@otplib/preset-default');
        authenticator.options = { window: 1 };
        return authenticator.verify({ token: code, secret: decryptedSecret });
    }
    async verifyEmailOtp(userId, code) {
        const otp = await this.prisma.emailOtp.findFirst({
            where: {
                userId,
                used: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otp)
            return false;
        const isValid = await bcrypt.compare(code, otp.code);
        if (isValid) {
            await this.prisma.emailOtp.update({
                where: { id: otp.id },
                data: { used: true },
            });
        }
        return isValid;
    }
    async verifyRecoveryCode(userId, code) {
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
    async checkLoginAttempts(email, ipAddress) {
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
            throw new common_1.ForbiddenException(`Account temporarily locked. Too many failed login attempts. Try again in ${this.LOCKOUT_DURATION_MINUTES} minutes.`);
        }
    }
    async recordLoginAttempt(email, userId, ipAddress, success = false) {
        await this.prisma.loginAttempt.create({
            data: {
                email,
                userId,
                ipAddress: ipAddress || null,
                success,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map