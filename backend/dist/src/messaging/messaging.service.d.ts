import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { SmsProvider } from './providers/sms.provider';
import { TriggerFeedbackRequestDto } from './dto/trigger-feedback-request.dto';
interface WhatsAppWebhookPayload {
    entry?: Array<{
        changes?: Array<{
            value?: {
                statuses?: Array<{
                    id?: string;
                    status?: string;
                    errors?: Array<{
                        code?: number;
                        title?: string;
                        message?: string;
                    }>;
                }>;
            };
        }>;
    }>;
}
export declare class MessagingService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly configService;
    private readonly whatsappProvider;
    private readonly smsProvider;
    private readonly logger;
    private queueWorkerTimer?;
    private readonly queuePollMs;
    private readonly queueBatchSize;
    private readonly duplicateWindowMs;
    constructor(prisma: PrismaService, configService: ConfigService, whatsappProvider: WhatsAppProvider, smsProvider: SmsProvider);
    onModuleInit(): void;
    onModuleDestroy(): void;
    triggerFeedbackRequest(staff: {
        id: string;
        role: Role;
        branchId?: string | null;
    }, payload: TriggerFeedbackRequestDto): Promise<{
        success: boolean;
        queued: boolean;
        duplicate: boolean;
        messageId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        surveyLink: string;
    } | {
        success: boolean;
        queued: boolean;
        messageId: string;
        surveyLink: string;
        duplicate?: undefined;
        status?: undefined;
    }>;
    verifyWebhook(mode?: string, verifyToken?: string, challenge?: string): string;
    handleWhatsAppWebhook(payload: WhatsAppWebhookPayload): Promise<{
        accepted: boolean;
        processed: number;
    }>;
    markDeliveredByToken(token: string): Promise<void>;
    private processPendingQueue;
    private claimAndProcessJob;
    private fallbackToSms;
    private buildSurveyUrl;
    private buildMessageText;
    private normalizePhone;
}
export {};
