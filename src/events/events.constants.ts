/**
 * Central registry of all system event names.
 *
 * Benefits:
 *  - Eliminates magic strings across modules
 *  - Single source of truth for all event identifiers
 *  - TypeScript IntelliSense support on every emit / listen call
 *  - Easy to extend when new events are introduced
 */
export const EVENTS = {
  /**
   * Emitted immediately after a feedback entry is successfully persisted.
   * Payload: FeedbackSubmittedPayload
   */
  FEEDBACK_SUBMITTED: 'feedback.submitted',

  /**
   * Reserved for future: emitted when a support case is auto-created.
   * Payload: CaseCreatedPayload (to be defined)
   */
  CASE_CREATED: 'case.created',

  ALERT_TRIGGERED: 'alert.triggered',
  
  /**
   * Emitted when a support case is marked as RESOLVED.
   * Triggers the closed-loop recovery messaging flow.
   */
  CASE_RESOLVED: 'case.resolved',
} as const;

/** Union type of all event name values — useful for generic listener typing */
export type SystemEvent = (typeof EVENTS)[keyof typeof EVENTS];
