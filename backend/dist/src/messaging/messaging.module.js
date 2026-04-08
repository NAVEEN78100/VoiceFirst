"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const messaging_service_1 = require("./messaging.service");
const messaging_controller_1 = require("./messaging.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const case_resolved_listener_1 = require("./case-resolved.listener");
const whatsapp_provider_1 = require("./providers/whatsapp.provider");
const sms_provider_1 = require("./providers/sms.provider");
let MessagingModule = class MessagingModule {
};
exports.MessagingModule = MessagingModule;
exports.MessagingModule = MessagingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [messaging_service_1.MessagingService, case_resolved_listener_1.CaseResolvedListener, whatsapp_provider_1.WhatsAppProvider, sms_provider_1.SmsProvider],
        controllers: [messaging_controller_1.MessagingController],
        exports: [messaging_service_1.MessagingService]
    })
], MessagingModule);
//# sourceMappingURL=messaging.module.js.map