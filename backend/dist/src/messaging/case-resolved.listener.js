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
var CaseResolvedListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseResolvedListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const events_constants_1 = require("../events/events.constants");
const messaging_service_1 = require("./messaging.service");
const client_1 = require("@prisma/client");
let CaseResolvedListener = CaseResolvedListener_1 = class CaseResolvedListener {
    messagingService;
    logger = new common_1.Logger(CaseResolvedListener_1.name);
    constructor(messagingService) {
        this.messagingService = messagingService;
    }
    async handleCaseResolved(payload) {
        if (!payload.phone) {
            this.logger.warn(`[CaseResolvedListener] Cannot trigger follow-up for Case ${payload.caseId}: No phone number.`);
            return;
        }
        this.logger.log(`[CaseResolvedListener] Triggering recovery survey for Case ${payload.caseId}`);
        await this.messagingService.triggerFeedbackRequest({
            id: 'SYSTEM',
            role: client_1.Role.ADMIN,
            branchId: payload.branchId,
        }, {
            phone: payload.phone,
            touchpointId: payload.touchpointId,
            caseId: payload.caseId,
        });
    }
};
exports.CaseResolvedListener = CaseResolvedListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_constants_1.EVENTS.CASE_RESOLVED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CaseResolvedListener.prototype, "handleCaseResolved", null);
exports.CaseResolvedListener = CaseResolvedListener = CaseResolvedListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService])
], CaseResolvedListener);
//# sourceMappingURL=case-resolved.listener.js.map