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
var WhatsAppProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let WhatsAppProvider = WhatsAppProvider_1 = class WhatsAppProvider {
    configService;
    logger = new common_1.Logger(WhatsAppProvider_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async sendTextMessage(to, body) {
        const accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
        const phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
        const apiVersion = this.configService.get('WHATSAPP_API_VERSION', 'v21.0');
        if (!accessToken || !phoneNumberId) {
            return {
                success: false,
                errorMessage: 'Missing WhatsApp credentials: WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID',
            };
        }
        const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
        try {
            const { data } = await axios_1.default.post(endpoint, {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: {
                    preview_url: true,
                    body,
                },
            }, {
                timeout: 15000,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const providerMessageId = data?.messages?.[0]?.id;
            this.logger.log(`WhatsApp API accepted message for ${to} with id=${providerMessageId ?? 'n/a'}`);
            return {
                success: true,
                providerMessageId,
                response: data,
            };
        }
        catch (err) {
            const providerData = err?.response?.data;
            const providerError = providerData?.error?.message || err?.message || 'Unknown WhatsApp API error';
            this.logger.error(`WhatsApp API send failed for ${to}: ${providerError}`);
            return {
                success: false,
                response: providerData,
                errorMessage: providerError,
            };
        }
    }
};
exports.WhatsAppProvider = WhatsAppProvider;
exports.WhatsAppProvider = WhatsAppProvider = WhatsAppProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsAppProvider);
//# sourceMappingURL=whatsapp.provider.js.map