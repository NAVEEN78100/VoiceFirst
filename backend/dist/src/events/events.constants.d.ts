export declare const EVENTS: {
    readonly FEEDBACK_SUBMITTED: "feedback.submitted";
    readonly CASE_CREATED: "case.created";
    readonly ALERT_TRIGGERED: "alert.triggered";
    readonly CASE_RESOLVED: "case.resolved";
};
export type SystemEvent = (typeof EVENTS)[keyof typeof EVENTS];
