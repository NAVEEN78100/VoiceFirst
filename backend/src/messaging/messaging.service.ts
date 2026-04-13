import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MessageChannel, MessageStatus, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
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
          errors?: Array<{ code?: number; title?: string; message?: string }>;
        }>;
      };
    }>;
  }>;
}

/**
 * MessagingService
 *
 * Handles the logic for active feedback triggering and automated follow-ups.
 * Implements a "WhatsApp-first with SMS fallback" delivery strategy.
 */
@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private queueWorkerTimer?: NodeJS.Timeout;

  private readonly queuePollMs: number;
  private readonly queueBatchSize: number;
  private readonly duplicateWindowMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly smsProvider: SmsProvider,
  ) {
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

  /**
   * Initiates a feedback request for a specific touchpoint.
   */
  async triggerFeedbackRequest(staff: { id: string; role: Role; branchId?: string | null }, payload: TriggerFeedbackRequestDto) {
    const phone = this.normalizePhone(payload.phone);

    // 1. Validate touchpoint
    const touchpoint = await this.prisma.touchpoint.findUnique({
      where: { id: payload.touchpointId },
    });

    if (!touchpoint) {
      throw new NotFoundException('Touchpoint target not found.');
    }

    if (staff.role === Role.MANAGER && staff.branchId !== touchpoint.branchId) {
      throw new ForbiddenException('Managers can only trigger messaging within their own branch.');
    }

    if (staff.role === Role.STAFF && touchpoint.staffId !== staff.id) {
      throw new ForbiddenException('Staff can only trigger messaging for their assigned touchpoints.');
    }

    const duplicateCutoff = new Date(Date.now() - this.duplicateWindowMs);
    const duplicate = await this.prisma.messageLog.findFirst({
      where: {
        phone,
        touchpointId: payload.touchpointId,
        createdAt: { gte: duplicateCutoff },
        status: { in: [MessageStatus.PENDING, MessageStatus.SENT, MessageStatus.DELIVERED] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, token: true, surveyUrl: true, status: true },
    });

    if (duplicate) {
      this.logger.warn(
        `[Messaging] Duplicate trigger suppressed for touchpoint=${payload.touchpointId} phone=${phone}. Returning existing message ${duplicate.id}.`,
      );
      return {
        success: true,
        queued: false,
        duplicate: true,
        messageId: duplicate.id,
        status: duplicate.status,
        surveyLink: duplicate.surveyUrl,
      };
    }

    // 2. Generate unique tracking token
    const token = randomUUID().replace(/-/g, '');
    const surveyLink = this.buildSurveyUrl(touchpoint.token, token, payload.caseId);

    // 3. Persist queue entry. Worker processes this asynchronously.
    const log = await this.prisma.messageLog.create({
      data: {
        phone,
        touchpointId: payload.touchpointId,
        staffId: staff.id,
        branchId: touchpoint.branchId,
        caseId: payload.caseId,
        token,
        surveyUrl: surveyLink,
        status: MessageStatus.PENDING,
        initialChannel: MessageChannel.WHATSAPP,
      },
    });

    return { 
      success: true, 
      queued: true,
      messageId: log.id, 
      surveyLink,
    };
  }

  verifyWebhook(mode?: string, verifyToken?: string, challenge?: string): string {
    const expectedToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    if (!expectedToken || mode !== 'subscribe' || verifyToken !== expectedToken || !challenge) {
      throw new ForbiddenException('Webhook verification failed.');
    }

    return challenge;
  }

  async handleWhatsAppWebhook(payload: WhatsAppWebhookPayload) {
    const statuses = payload.entry?.flatMap((entry) =>
      (entry.changes || []).flatMap((change) => change.value?.statuses || []),
    ) || [];

    if (statuses.length === 0) {
      this.logger.warn('[Messaging] WhatsApp webhook received with no statuses payload.');
      return { accepted: true, processed: 0 };
    }

    let processed = 0;

    for (const statusEvent of statuses) {
      const providerMessageId = statusEvent.id;
      if (!providerMessageId) continue;

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
            status: MessageStatus.SENT,
            sentAt: messageLog.sentAt || new Date(),
            channelUsed: MessageChannel.WHATSAPP,
            providerResponse: statusEvent as unknown as object,
          },
        });
      } else if (status === 'delivered' || status === 'read') {
        await this.prisma.messageLog.update({
          where: { id: messageLog.id },
          data: {
            status: MessageStatus.DELIVERED,
            deliveredAt: new Date(),
            channelUsed: MessageChannel.WHATSAPP,
            providerResponse: statusEvent as unknown as object,
          },
        });
      } else if (status === 'failed' || status === 'undelivered') {
        const reason = statusEvent.errors?.[0]?.message || 'WhatsApp delivery failed by webhook status.';
        await this.prisma.messageLog.update({
          where: { id: messageLog.id },
          data: {
            status: MessageStatus.FAILED,
            failedAt: new Date(),
            errorMessage: reason,
            providerResponse: statusEvent as unknown as object,
          },
        });
        await this.fallbackToSms(messageLog.id, reason);
      }

      processed += 1;
    }

    return { accepted: true, processed };
  }

  async markDeliveredByToken(token: string) {
    const existing = await this.prisma.messageLog.findUnique({
      where: { token },
      select: { id: true, status: true },
    });

    if (!existing || existing.status === MessageStatus.DELIVERED) {
      return;
    }

    await this.prisma.messageLog.update({
      where: { token },
      data: {
        status: MessageStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });
  }

  private async processPendingQueue() {
    const jobs = await this.prisma.messageLog.findMany({
      where: {
        status: MessageStatus.PENDING,
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

  private async claimAndProcessJob(messageId: string) {
    const claimResult = await this.prisma.messageLog.updateMany({
      where: {
        id: messageId,
        status: MessageStatus.PENDING,
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
    if (!message) return;

    const text = this.buildMessageText(message.surveyUrl);
    const whatsappResult = await this.whatsappProvider.sendTextMessage(message.phone, text);

    if (whatsappResult.success) {
      await this.prisma.messageLog.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.SENT,
          channelUsed: MessageChannel.WHATSAPP,
          sentAt: new Date(),
          whatsappMessageId: whatsappResult.providerMessageId,
          providerResponse: whatsappResult.response as object,
          errorMessage: null,
        },
      });
      return;
    }

    const reason = whatsappResult.errorMessage || 'WhatsApp send failed';
    this.logger.warn(`[Messaging] WhatsApp send failed for message=${message.id}. Triggering SMS fallback. reason=${reason}`);
    await this.fallbackToSms(message.id, reason, whatsappResult.response);
  }

  private async fallbackToSms(messageId: string, reason: string, providerResponse?: unknown) {
    const message = await this.prisma.messageLog.findUnique({ where: { id: messageId } });
    if (!message) return;

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
          status: MessageStatus.SENT,
          channelUsed: MessageChannel.SMS,
          sentAt: new Date(),
          smsMessageId: smsResult.providerMessageId,
          smsFallbackTriggeredAt: new Date(),
          errorMessage: reason,
          providerResponse: (smsResult.response ?? providerResponse) as object,
        },
      });
      return;
    }

    const finalError = smsResult.errorMessage || 'SMS fallback failed';
    await this.prisma.messageLog.update({
      where: { id: message.id },
      data: {
        status: MessageStatus.FAILED,
        channelUsed: MessageChannel.SMS,
        failedAt: new Date(),
        smsFallbackTriggeredAt: new Date(),
        errorMessage: `${reason} | SMS fallback: ${finalError}`,
        providerResponse: (smsResult.response ?? providerResponse) as object,
      },
    });
  }

  private buildSurveyUrl(touchpointToken: string, messageToken: string, caseId?: string): string {
    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL', 'http://localhost:3000');
    const params = new URLSearchParams({ t: touchpointToken, m: messageToken });
    if (caseId) params.set('c', caseId);
    return `${frontendBaseUrl}/feedback?${params.toString()}`;
  }

  private buildMessageText(surveyUrl: string): string {
    return `Greetings! Thank you for choosing VoiceFirst. We value your feedback. Please share your experience here: ${surveyUrl}`;
  }

  /**
   * Sends an immediate alert to the Branch Manager for negative feedback.
   */
  async sendManagerAlert(managerPhone: string, feedback: any, branchName: string) {
    const text = `🔴 *Urgent Service Recovery Required*\n\nCritical feedback received at *${branchName}*.\n\n*Rating:* ${feedback.rating}/5\n*Issue:* "${feedback.comment || 'No comment'}"\n*Customer:* ${feedback.phone || 'Anonymous'}\n\nPlease take immediate action to resolve this.`;
    return this.whatsappProvider.sendTextMessage(managerPhone, text);
  }

  /**
   * Notifies the customer that their issue is being addressed.
   */
  async sendRecoveryStarted(customerPhone: string, branchName: string) {
    const text = `👋 *Hi there!*\n\nThis is the team at *${branchName}*. We genuinely value your feedback.\n\nJust wanted to let you know that we have started working on the issue you reported. Your satisfaction is our top priority!`;
    return this.whatsappProvider.sendTextMessage(customerPhone, text);
  }

  /**
   * Informs the customer that the issue has been successfully resolved.
   */
  async sendResolution(customerPhone: string, branchName: string, notes: string) {
    const text = `✨ *Great News!*\n\nThe issue you recently reported at *${branchName}* has been fully resolved.\n\n*Internal Resolution:* ${notes}\n\nYour feedback was incredibly helpful in making us better! Thank you for your patience.\n\n_— The VoiceFirst Team_`;
    return this.whatsappProvider.sendTextMessage(customerPhone, text);
  }

  private normalizePhone(rawPhone: string): string {
    const defaultCountryCode = this.configService.get<string>('MESSAGING_DEFAULT_COUNTRY_CODE', '+1');

    const trimmed = (rawPhone || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Phone number is required.');
    }

    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');

    let normalized = hasPlus ? `+${digits}` : `${defaultCountryCode}${digits}`;
    normalized = `+${normalized.replace(/\D/g, '')}`;

    const justDigits = normalized.replace(/\D/g, '');
    if (justDigits.length < 8 || justDigits.length > 15) {
      throw new BadRequestException('Invalid phone number format. Use E.164 compatible number.');
    }

    return normalized;
  }
}
