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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
let SmsProvider = SmsProvider_1 = class SmsProvider {
    configService;
    logger = new common_1.Logger(SmsProvider_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async sendTextMessage(to, body) {
        const sid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        const from = this.configService.get('TWILIO_FROM_NUMBER');
        if (!sid || !authToken || !from) {
            const mockId = `mock-sms-${(0, crypto_1.randomUUID)()}`;
            this.logger.warn(`Twilio credentials missing. Using mock SMS send for ${to} (id=${mockId}).`);
            this.logger.log(`[SMS-MOCK] ${to}: ${body}`);
            return {
                success: true,
                providerMessageId: mockId,
                response: { mocked: true },
            };
        }
        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('From', from);
        params.append('Body', body);
        try {
            const { data } = await axios_1.default.post(endpoint, params.toString(), {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                auth: {
                    username: sid,
                    password: authToken,
                },
            });
            this.logger.log(`SMS provider accepted message for ${to} with id=${data?.sid ?? 'n/a'}`);
            return {
                success: true,
                providerMessageId: data?.sid,
                response: data,
            };
        }
        catch (err) {
            const providerData = err?.response?.data;
            const providerError = providerData?.message || err?.message || 'Unknown SMS provider error';
            this.logger.error(`SMS send failed for ${to}: ${providerError}`);
            return {
                success: false,
                response: providerData,
                errorMessage: providerError,
            };
        }
    }
};
exports.SmsProvider = SmsProvider;
exports.SmsProvider = SmsProvider = SmsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsProvider);
//# sourceMappingURL=sms.provider.js.map