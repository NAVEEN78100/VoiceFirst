import { MessagingService } from './messaging.service';
import { TriggerFeedbackRequestDto } from './dto/trigger-feedback-request.dto';
export declare class MessagingController {
    private readonly messagingService;
    constructor(messagingService: MessagingService);
    trigger(req: any, dto: TriggerFeedbackRequestDto): Promise<{
        success: boolean;
        queued: boolean;
        duplicate: boolean;
        messageId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        surveyLink: string;
    } | {
        success: boolean;
        queued: boolean;
        messageId: string;
        surveyLink: string;
        duplicate?: undefined;
        status?: undefined;
    }>;
    verifyWebhook(mode?: string, verifyToken?: string, challenge?: string): string;
    handleWebhook(payload: any): Promise<{
        received: boolean;
    }>;
}
