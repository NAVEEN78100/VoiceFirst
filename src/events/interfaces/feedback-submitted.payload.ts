/**
 * Strongly-typed payload for the `feedback.submitted` event.
 *
 * Design principles:
 *  - Contains only data needed for downstream processing.
 *  - No sensitive PII beyond an optional phone flag.
 *  - Immutable value object — handlers must not mutate it.
 */
export interface FeedbackSubmittedPayload {
  /** UUID of the newly created feedback record */
  readonly feedbackId: string;

  /** Rating value between 1 and 5 */
  readonly rating: number;

  /** UUID of the touchpoint that captured the feedback */
  readonly touchpointId: string;

  /** UUID of the branch associated with the touchpoint */
  readonly branchId: string;

  /** Whether the submitter provided a contact phone number (for follow-up eligibility) */
  readonly hasPhone: boolean;

  /** The selected primary issue. */
  readonly issueTopic?: string;

  /** Snippet of the comment for immediate notification context */
  readonly commentPreview?: string;

  /** ISO 8601 timestamp of when the feedback was submitted */
  readonly submittedAt: string;

  /**
   * Optional metadata bag for extensibility.
   * Downstream handlers may carry additional context here
   * without modifying the core payload contract.
   */
  readonly metadata?: Record<string, unknown>;
}
