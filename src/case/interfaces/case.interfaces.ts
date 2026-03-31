/**
 * Input contract for the CaseService.createCaseForFeedback method.
 * Keeps the service API explicit and avoids leaking the full
 * FeedbackSubmittedPayload into the case domain.
 */
export interface CreateCaseInput {
  /** UUID of the originating feedback record */
  readonly feedbackId: string;

  /** Rating that triggered case creation (expected 1–2) */
  readonly rating: number;

  /** Branch where the feedback originated */
  readonly branchId: string;

  /** Touchpoint that captured the feedback */
  readonly touchpointId: string;

  /** Whether a follow-up phone contact is possible */
  readonly hasPhone: boolean;
}

/**
 * Result returned by CaseService.createCaseForFeedback.
 * Explicit result type avoids null checks at the call site.
 */
export interface CreateCaseResult {
  /** true if a new case was persisted; false if deduplication skipped it */
  readonly created: boolean;

  /** UUID of the new (or existing) case record */
  readonly caseId: string | null;
}
