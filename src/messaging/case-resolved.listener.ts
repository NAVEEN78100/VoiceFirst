import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../events/events.constants';
import { MessagingService } from './messaging.service';
import { Role } from '@prisma/client';

@Injectable()
export class CaseResolvedListener {
  private readonly logger = new Logger(CaseResolvedListener.name);

  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Listens for case resolution events and triggers a closed-loop follow-up.
   */
  @OnEvent(EVENTS.CASE_RESOLVED)
  async handleCaseResolved(payload: { caseId: string; branchId: string; phone?: string; touchpointId: string }) {
    if (!payload.phone) {
      this.logger.warn(`[CaseResolvedListener] Cannot trigger follow-up for Case ${payload.caseId}: No phone number.`);
      return;
    }

    this.logger.log(`[CaseResolvedListener] Triggering recovery survey for Case ${payload.caseId}`);

    // Trigger feedback request with caseId context
    await this.messagingService.triggerFeedbackRequest(
      {
        id: 'SYSTEM',
        role: Role.ADMIN,
        branchId: payload.branchId,
      },
      {
        phone: payload.phone,
        touchpointId: payload.touchpointId,
        caseId: payload.caseId,
      },
    );
  }
}
