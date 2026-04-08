export interface FeedbackSubmittedPayload {
    readonly feedbackId: string;
    readonly rating: number;
    readonly touchpointId: string;
    readonly branchId: string;
    readonly hasPhone: boolean;
    readonly issueTopic?: string;
    readonly commentPreview?: string;
    readonly submittedAt: string;
    readonly metadata?: Record<string, unknown>;
}
