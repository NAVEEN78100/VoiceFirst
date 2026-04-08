export interface CreateCaseInput {
    readonly feedbackId: string;
    readonly rating: number;
    readonly branchId: string;
    readonly touchpointId: string;
    readonly hasPhone: boolean;
}
export interface CreateCaseResult {
    readonly created: boolean;
    readonly caseId: string | null;
}
