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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disable2faDto = exports.VerifyTotpSetupDto = exports.Enable2faDto = exports.TwoFactorSetupMethod = void 0;
const class_validator_1 = require("class-validator");
var TwoFactorSetupMethod;
(function (TwoFactorSetupMethod) {
    TwoFactorSetupMethod["TOTP"] = "TOTP";
    TwoFactorSetupMethod["EMAIL"] = "EMAIL";
})(TwoFactorSetupMethod || (exports.TwoFactorSetupMethod = TwoFactorSetupMethod = {}));
class Enable2faDto {
    method;
}
exports.Enable2faDto = Enable2faDto;
__decorate([
    (0, class_validator_1.IsEnum)(TwoFactorSetupMethod, {
        message: 'Method must be one of: TOTP, EMAIL',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '2FA method is required' }),
    __metadata("design:type", String)
], Enable2faDto.prototype, "method", void 0);
class VerifyTotpSetupDto {
    code;
}
exports.VerifyTotpSetupDto = VerifyTotpSetupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'TOTP code is required for verification' }),
    __metadata("design:type", String)
], VerifyTotpSetupDto.prototype, "code", void 0);
class Disable2faDto {
    password;
}
exports.Disable2faDto = Disable2faDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required to disable 2FA' }),
    __metadata("design:type", String)
], Disable2faDto.prototype, "password", void 0);
//# sourceMappingURL=enable-2fa.dto.js.map