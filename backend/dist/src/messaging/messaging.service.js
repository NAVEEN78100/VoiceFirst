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
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const whatsapp_provider_1 = require("./providers/whatsapp.provider");
const sms_provider_1 = require("./providers/sms.provider");
let MessagingService = MessagingService_1 = class MessagingService {
    prisma;
    configService;
    whatsappProvider;
    smsProvider;
    logger = new common_1.Logger(MessagingService_1.name);
    queueWorkerTimer;
    queuePollMs;
    queueBatchSize;
    duplicateWindowMs;
    constructor(prisma, configService, whatsappProvider, smsProvider) {
        this.prisma = prisma;
        this.configService = configService;
        this.whatsappProvider = whatsappProvider;
        this.smsProvider = smsProvider;
        this.queuePollMs = Number(this.configService.get('MESSAGING_QUEUE_POLL_MS', 5000));
        this.queueBatchSize = Number(this.configService.get('MESSAGING_QUEUE_BATCH_SIZE', 10));
        this.duplicateWindowMs = Number(this.configService.get('MESSAGING_DUPLICATE_WINDOW_MS', 120000));
    }
    onModuleInit() {
        this.queueWorkerTimer = setInterval(() => {
            void this.processPendingQueue();
        }, this.queuePollMs);
        this.logger.log(`Messaging queue worker started with poll interval ${this.queuePollMs}ms.`);
    }
    onModuleDestroy() {
        if (this.queueWorkerTimer) {
            clearInterval(this.queueWorkerTimer);
            this.queueWorkerTimer = undefined;
        }
    }
    async triggerFeedbackRequest(staff, payload) {
        const phone = this.normalizePhone(payload.phone);
        const touchpoint = await this.prisma.touchpoint.findUnique({
            where: { id: payload.touchpointId },
        });
        if (!touchpoint) {
            throw new common_1.NotFoundException('Touchpoint target not found.');
        }
        if (staff.role === client_1.Role.MANAGER && staff.branchId !== touchpoint.branchId) {
            throw new common_1.ForbiddenException('Managers can only trigger messaging within their own branch.');
        }
        if (staff.role === client_1.Role.STAFF && touchpoint.staffId !== staff.id) {
            throw new common_1.ForbiddenException('Staff can only trigger messaging for their assigned touchpoints.');
        }
        const duplicateCutoff = new Date(Date.now() - this.duplicateWindowMs);
        const duplicate = await this.prisma.messageLog.findFirst({
            where: {
                phone,
                touchpointId: payload.touchpointId,
                createdAt: { gte: duplicateCutoff },
                status: { in: [client_1.MessageStatus.PENDING, client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, token: true, surveyUrl: true, status: true },
        });
        if (duplicate) {
            this.logger.warn(`[Messaging] Duplicate trigger suppressed for touchpoint=${payload.touchpointId} phone=${phone}. Returning existing message ${duplicate.id}.`);
            return {
                success: true,
                queued: false,
                duplicate: true,
                messageId: duplicate.id,
                status: duplicate.status,
                surveyLink: duplicate.surveyUrl,
            };
        }
        const token = (0, crypto_1.randomUUID)().replace(/-/g, '');
        const surveyLink = this.buildSurveyUrl(touchpoint.token, token, payload.caseId);
        const log = await this.prisma.messageLog.create({
            data: {
                phone,
                touchpointId: payload.touchpointId,
                staffId: staff.id,
                branchId: touchpoint.branchId,
                caseId: payload.caseId,
                token,
                surveyUrl: surveyLink,
                status: client_1.MessageStatus.PENDING,
                initialChannel: client_1.MessageChannel.WHATSAPP,
            },
        });
        return {
            success: true,
            queued: true,
            messageId: log.id,
            surveyLink,
        };
    }
    verifyWebhook(mode, verifyToken, challenge) {
        const expectedToken = this.configService.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
        if (!expectedToken || mode !== 'subscribe' || verifyToken !== expectedToken || !challenge) {
            throw new common_1.ForbiddenException('Webhook verification failed.');
        }
        return challenge;
    }
    async handleWhatsAppWebhook(payload) {
        const statuses = payload.entry?.flatMap((entry) => (entry.changes || []).flatMap((change) => change.value?.statuses || [])) || [];
        if (statuses.length === 0) {
            this.logger.warn('[Messaging] WhatsApp webhook received with no statuses payload.');
            return { accepted: true, processed: 0 };
        }
        let processed = 0;
        for (const statusEvent of statuses) {
            const providerMessageId = statusEvent.id;
            if (!providerMessageId)
                continue;
            const messageLog = await this.prisma.messageLog.findUnique({
                where: { whatsappMessageId: providerMessageId },
            });
            if (!messageLog) {
                this.logger.warn(`[Messaging] Webhook status for unknown provider id: ${providerMessageId}`);
                continue;
            }
            const status = (statusEvent.status || '').toLowerCase();
            if (status === 'sent') {
                await this.prisma.messageLog.update({
                    where: { id: messageLog.id },
                    data: {
                        status: client_1.MessageStatus.SENT,
                        sentAt: messageLog.sentAt || new Date(),
                        channelUsed: client_1.MessageChannel.WHATSAPP,
                        providerResponse: statusEvent,
                    },
                });
            }
            else if (status === 'delivered' || status === 'read') {
                await this.prisma.messageLog.update({
                    where: { id: messageLog.id },
                    data: {
                        status: client_1.MessageStatus.DELIVERED,
                        deliveredAt: new Date(),
                        channelUsed: client_1.MessageChannel.WHATSAPP,
                        providerResponse: statusEvent,
                    },
                });
            }
            else if (status === 'failed' || status === 'undelivered') {
                const reason = statusEvent.errors?.[0]?.message || 'WhatsApp delivery failed by webhook status.';
                await this.prisma.messageLog.update({
                    where: { id: messageLog.id },
                    data: {
                        status: client_1.MessageStatus.FAILED,
                        failedAt: new Date(),
                        errorMessage: reason,
                        providerResponse: statusEvent,
                    },
                });
                await this.fallbackToSms(messageLog.id, reason);
            }
            processed += 1;
        }
        return { accepted: true, processed };
    }
    async markDeliveredByToken(token) {
        const existing = await this.prisma.messageLog.findUnique({
            where: { token },
            select: { id: true, status: true },
        });
        if (!existing || existing.status === client_1.MessageStatus.DELIVERED) {
            return;
        }
        await this.prisma.messageLog.update({
            where: { token },
            data: {
                status: client_1.MessageStatus.DELIVERED,
                deliveredAt: new Date(),
            },
        });
    }
    async processPendingQueue() {
        const jobs = await this.prisma.messageLog.findMany({
            where: {
                status: client_1.MessageStatus.PENDING,
                processingStartedAt: null,
            },
            orderBy: { queuedAt: 'asc' },
            take: this.queueBatchSize,
            select: { id: true },
        });
        if (jobs.length === 0) {
            return;
        }
        this.logger.log(`[Messaging] Processing ${jobs.length} queued messaging jobs.`);
        for (const job of jobs) {
            await this.claimAndProcessJob(job.id);
        }
    }
    async claimAndProcessJob(messageId) {
        const claimResult = await this.prisma.messageLog.updateMany({
            where: {
                id: messageId,
                status: client_1.MessageStatus.PENDING,
                processingStartedAt: null,
            },
            data: {
                processingStartedAt: new Date(),
                retryCount: { increment: 1 },
            },
        });
        if (claimResult.count === 0) {
            return;
        }
        const message = await this.prisma.messageLog.findUnique({ where: { id: messageId } });
        if (!message)
            return;
        const text = this.buildMessageText(message.surveyUrl);
        const whatsappResult = await this.whatsappProvider.sendTextMessage(message.phone, text);
        if (whatsappResult.success) {
            await this.prisma.messageLog.update({
                where: { id: message.id },
                data: {
                    status: client_1.MessageStatus.SENT,
                    channelUsed: client_1.MessageChannel.WHATSAPP,
                    sentAt: new Date(),
                    whatsappMessageId: whatsappResult.providerMessageId,
                    providerResponse: whatsappResult.response,
                    errorMessage: null,
                },
            });
            return;
        }
        const reason = whatsappResult.errorMessage || 'WhatsApp send failed';
        this.logger.warn(`[Messaging] WhatsApp send failed for message=${message.id}. Triggering SMS fallback. reason=${reason}`);
        await this.fallbackToSms(message.id, reason, whatsappResult.response);
    }
    async fallbackToSms(messageId, reason, providerResponse) {
        const message = await this.prisma.messageLog.findUnique({ where: { id: messageId } });
        if (!message)
            return;
        if (message.smsFallbackTriggeredAt) {
            this.logger.warn(`[Messaging] SMS fallback already executed for message=${message.id}; skipping duplicate fallback.`);
            return;
        }
        const text = this.buildMessageText(message.surveyUrl);
        const smsResult = await this.smsProvider.sendTextMessage(message.phone, text);
        if (smsResult.success) {
            await this.prisma.messageLog.update({
                where: { id: message.id },
                data: {
                    status: client_1.MessageStatus.SENT,
                    channelUsed: client_1.MessageChannel.SMS,
                    sentAt: new Date(),
                    smsMessageId: smsResult.providerMessageId,
                    smsFallbackTriggeredAt: new Date(),
                    errorMessage: reason,
                    providerResponse: (smsResult.response ?? providerResponse),
                },
            });
            return;
        }
        const finalError = smsResult.errorMessage || 'SMS fallback failed';
        await this.prisma.messageLog.update({
            where: { id: message.id },
            data: {
                status: client_1.MessageStatus.FAILED,
                channelUsed: client_1.MessageChannel.SMS,
                failedAt: new Date(),
                smsFallbackTriggeredAt: new Date(),
                errorMessage: `${reason} | SMS fallback: ${finalError}`,
                providerResponse: (smsResult.response ?? providerResponse),
            },
        });
    }
    buildSurveyUrl(touchpointToken, messageToken, caseId) {
        const frontendBaseUrl = this.configService.get('FRONTEND_BASE_URL', 'http://localhost:3000');
        const params = new URLSearchParams({ t: touchpointToken, m: messageToken });
        if (caseId)
            params.set('c', caseId);
        return `${frontendBaseUrl}/feedback?${params.toString()}`;
    }
    buildMessageText(surveyUrl) {
        return `Thank you for choosing VoiceFirst. Please share your quick feedback: ${surveyUrl}`;
    }
    normalizePhone(rawPhone) {
        const defaultCountryCode = this.configService.get('MESSAGING_DEFAULT_COUNTRY_CODE', '+1');
        const trimmed = (rawPhone || '').trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Phone number is required.');
        }
        const hasPlus = trimmed.startsWith('+');
        const digits = trimmed.replace(/\D/g, '');
        let normalized = hasPlus ? `+${digits}` : `${defaultCountryCode}${digits}`;
        normalized = `+${normalized.replace(/\D/g, '')}`;
        const justDigits = normalized.replace(/\D/g, '');
        if (justDigits.length < 8 || justDigits.length > 15) {
            throw new common_1.BadRequestException('Invalid phone number format. Use E.164 compatible number.');
        }
        return normalized;
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        whatsapp_provider_1.WhatsAppProvider,
        sms_provider_1.SmsProvider])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map