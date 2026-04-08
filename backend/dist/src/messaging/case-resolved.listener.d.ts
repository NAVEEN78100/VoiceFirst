import { MessagingService } from './messaging.service';
export declare class CaseResolvedListener {
    private readonly messagingService;
    private readonly logger;
    constructor(messagingService: MessagingService);
    handleCaseResolved(payload: {
        caseId: string;
        branchId: string;
        phone?: string;
        touchpointId: string;
    }): Promise<void>;
}
