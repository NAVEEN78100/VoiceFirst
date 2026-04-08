import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import type { Request } from 'express';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(createFeedbackDto: CreateFeedbackDto, req: Request): Promise<{
        message: string;
        feedbackId: string;
        perkPointsAwarded: number;
        totalPerkPoints: number;
    }>;
    getTouchpointContext(token: string): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        branch: {
            name: string;
            location: string | null;
        };
    }>;
    getExplorer(user: any, page?: number, limit?: number, startDate?: string, endDate?: string, rating?: number, branchId?: string, hasCase?: string, search?: string): Promise<{
        items: ({
            branch: {
                name: string;
            };
            touchpoint: {
                name: string;
                type: import("@prisma/client").$Enums.TouchpointType;
            };
            case: {
                id: string;
                status: import("@prisma/client").$Enums.CaseStatus;
                priority: import("@prisma/client").$Enums.CasePriority;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            branchId: string;
            ipAddress: string | null;
            phone: string | null;
            touchpointId: string;
            rating: number;
            comment: string | null;
            issueTopic: string | null;
            serviceCategory: string | null;
            issueTags: string | null;
            followUpRequested: boolean;
            trackType: string;
            channel: string;
            country: string | null;
            city: string | null;
            deviceType: string | null;
            browser: string | null;
            os: string | null;
            userAgent: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
