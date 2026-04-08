import type { FeedbackSubmittedPayload } from '../interfaces/feedback-submitted.payload';
import { CaseService } from '../../case/case.service';
export declare class FeedbackSubmittedListener {
    private readonly caseService;
    private readonly logger;
    private static readonly CASE_THRESHOLD;
    constructor(caseService: CaseService);
    handleFeedbackSubmitted(payload: FeedbackSubmittedPayload): Promise<void>;
    private handleLowRatingFeedback;
    private handleNeutralOrPositiveFeedback;
}
