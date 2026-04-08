"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorController = void 0;
const common_1 = require("@nestjs/common");
const two_factor_service_1 = require("./two-factor.service");
const enable_2fa_dto_1 = require("./dto/enable-2fa.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TwoFactorController = class TwoFactorController {
    twoFactorService;
    constructor(twoFactorService) {
        this.twoFactorService = twoFactorService;
    }
    async getStatus(userId) {
        return this.twoFactorService.get2faStatus(userId);
    }
    async setup(userId, enable2faDto) {
        if (enable2faDto.method === enable_2fa_dto_1.TwoFactorSetupMethod.TOTP) {
            return this.twoFactorService.generateTotpSecret(userId);
        }
        else if (enable2faDto.method === enable_2fa_dto_1.TwoFactorSetupMethod.EMAIL) {
            return this.twoFactorService.enableEmail2fa(userId);
        }
    }
    async verifyTotpSetup(userId, verifyDto) {
        return this.twoFactorService.verifyAndEnableTotp(userId, verifyDto.code);
    }
    async sendEmailOtp(userId) {
        return this.twoFactorService.generateEmailOtp(userId);
    }
    async regenerateRecoveryCodes(userId, password) {
        const codes = await this.twoFactorService.regenerateRecoveryCodes(userId, password);
        return {
            recoveryCodes: codes,
            warning: 'Save these recovery codes in a safe place. They will not be shown again.',
        };
    }
    async disable(userId, disable2faDto) {
        return this.twoFactorService.disable2fa(userId, disable2faDto.password);
    }
};
exports.TwoFactorController = TwoFactorController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('setup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, enable_2fa_dto_1.Enable2faDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "setup", null);
__decorate([
    (0, common_1.Post)('verify-totp-setup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, enable_2fa_dto_1.VerifyTotpSetupDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "verifyTotpSetup", null);
__decorate([
    (0, common_1.Post)('send-email-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "sendEmailOtp", null);
__decorate([
    (0, common_1.Post)('regenerate-recovery-codes'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "regenerateRecoveryCodes", null);
__decorate([
    (0, common_1.Post)('disable'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, enable_2fa_dto_1.Disable2faDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "disable", null);
exports.TwoFactorController = TwoFactorController = __decorate([
    (0, common_1.Controller)('2fa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [two_factor_service_1.TwoFactorService])
], TwoFactorController);
//# sourceMappingURL=two-factor.controller.js.map