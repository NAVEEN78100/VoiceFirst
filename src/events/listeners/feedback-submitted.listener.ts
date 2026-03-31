import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../events.constants';
import type { FeedbackSubmittedPayload } from '../interfaces/feedback-submitted.payload';
import { CaseService } from '../../case/case.service';

/**
 * FeedbackSubmittedListener
 *
 * Reacts to the `feedback.submitted` event and delegates to the
 * appropriate downstream service based on business logic rules.
 *
 * Responsibilities:
 *  - Evaluate the feedback rating
 *  - Trigger case creation for low ratings (1–2)
 *  - Log all outcomes for observability
 *  - Remain idempotent: relies on CaseService's dedup guard
 *
 * Extension points:
 *  - Add additional @OnEvent handlers in this class or create
 *    new listeners (e.g. AlertListener, AnalyticsListener) without
 *    touching this file.
 *
 * Non-blocking: The event handler is decoupled from the HTTP response cycle.
 * Errors here do NOT propagate to the caller.
 */
@Injectable()
export class FeedbackSubmittedListener {
  private readonly logger = new Logger(FeedbackSubmittedListener.name);

  /** Ratings at or below this threshold trigger automatic case creation */
  private static readonly CASE_THRESHOLD = 2;

  constructor(private readonly caseService: CaseService) {}

  /**
   * Primary handler for feedback.submitted event.
   *
   * @param payload - Typed event payload from FeedbackService
   */
  @OnEvent(EVENTS.FEEDBACK_SUBMITTED, { async: true })
  async handleFeedbackSubmitted(payload: FeedbackSubmittedPayload): Promise<void> {
    this.logger.log(
      `[Event:feedback.submitted] Received — feedbackId=${payload.feedbackId} | rating=${payload.rating} | branch=${payload.branchId}`,
    );

    try {
      if (payload.rating <= FeedbackSubmittedListener.CASE_THRESHOLD) {
        await this.handleLowRatingFeedback(payload);
      } else {
        this.handleNeutralOrPositiveFeedback(payload);
      }
    } catch (err: unknown) {
      // Errors in event handlers are isolated — they never propagate to the caller
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[Event:feedback.submitted] Handler failed — feedbackId=${payload.feedbackId} | error=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  /**
   * Handles low-rating feedback (rating 1 or 2).
   * Triggers automatic case creation for follow-up.
   */
  private async handleLowRatingFeedback(payload: FeedbackSubmittedPayload): Promise<void> {
    this.logger.warn(
      `[Event:feedback.submitted] Low rating detected (${payload.rating}/5) — initiating case creation for feedbackId=${payload.feedbackId}`,
    );

    const result = await this.caseService.createCaseForFeedback({
      feedbackId: payload.feedbackId,
      rating: payload.rating,
      branchId: payload.branchId,
      touchpointId: payload.touchpointId,
      hasPhone: payload.hasPhone,
    });

    if (result.created) {
      this.logger.log(
        `[Event:feedback.submitted] Case created successfully — caseId=${result.caseId} | feedbackId=${payload.feedbackId}`,
      );
    } else {
      this.logger.warn(
        `[Event:feedback.submitted] Case creation skipped (duplicate guard) — feedbackId=${payload.feedbackId}`,
      );
    }
  }

  /**
   * Handles neutral or positive feedback (rating 3–5).
   * No immediate action required. Logs for future analytics hooks.
   */
  private handleNeutralOrPositiveFeedback(payload: FeedbackSubmittedPayload): void {
    this.logger.log(
      `[Event:feedback.submitted] Positive/neutral feedback (${payload.rating}/5) — no case required | feedbackId=${payload.feedbackId}`,
    );

    // Future extension point: emit analytics event, trigger engagement flow, etc.
    // Example:
    // this.eventEmitter.emit(EVENTS.ANALYTICS_FEEDBACK_POSITIVE, payload);
  }
}
