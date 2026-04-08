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
var FeedbackSubmittedListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackSubmittedListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const events_constants_1 = require("../events.constants");
const case_service_1 = require("../../case/case.service");
let FeedbackSubmittedListener = class FeedbackSubmittedListener {
    static { FeedbackSubmittedListener_1 = this; }
    caseService;
    logger = new common_1.Logger(FeedbackSubmittedListener_1.name);
    static CASE_THRESHOLD = 2;
    constructor(caseService) {
        this.caseService = caseService;
    }
    async handleFeedbackSubmitted(payload) {
        this.logger.log(`[Event:feedback.submitted] Received — feedbackId=${payload.feedbackId} | rating=${payload.rating} | branch=${payload.branchId}`);
        try {
            if (payload.rating <= FeedbackSubmittedListener_1.CASE_THRESHOLD) {
                await this.handleLowRatingFeedback(payload);
            }
            else {
                this.handleNeutralOrPositiveFeedback(payload);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`[Event:feedback.submitted] Handler failed — feedbackId=${payload.feedbackId} | error=${message}`, err instanceof Error ? err.stack : undefined);
        }
    }
    async handleLowRatingFeedback(payload) {
        this.logger.warn(`[Event:feedback.submitted] Low rating detected (${payload.rating}/5) — initiating case creation for feedbackId=${payload.feedbackId}`);
        const result = await this.caseService.createCaseForFeedback({
            feedbackId: payload.feedbackId,
            rating: payload.rating,
            branchId: payload.branchId,
            touchpointId: payload.touchpointId,
            hasPhone: payload.hasPhone,
        });
        if (result.created) {
            this.logger.log(`[Event:feedback.submitted] Case created successfully — caseId=${result.caseId} | feedbackId=${payload.feedbackId}`);
        }
        else {
            this.logger.warn(`[Event:feedback.submitted] Case creation skipped (duplicate guard) — feedbackId=${payload.feedbackId}`);
        }
    }
    handleNeutralOrPositiveFeedback(payload) {
        this.logger.log(`[Event:feedback.submitted] Positive/neutral feedback (${payload.rating}/5) — no case required | feedbackId=${payload.feedbackId}`);
    }
};
exports.FeedbackSubmittedListener = FeedbackSubmittedListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_constants_1.EVENTS.FEEDBACK_SUBMITTED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeedbackSubmittedListener.prototype, "handleFeedbackSubmitted", null);
exports.FeedbackSubmittedListener = FeedbackSubmittedListener = FeedbackSubmittedListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [case_service_1.CaseService])
], FeedbackSubmittedListener);
//# sourceMappingURL=feedback-submitted.listener.js.map