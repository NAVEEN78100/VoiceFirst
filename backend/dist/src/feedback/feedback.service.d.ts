import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { Request } from 'express';
export declare class FeedbackService {
    private readonly prisma;
    private readonly eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    submitFeedback(dto: CreateFeedbackDto, req: Request): Promise<{
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
    private maskIp;
    private getGeoLocation;
    getFeedbackExplorer(user: {
        id: string;
        role: Role;
        branchId?: string;
    }, params: {
        page: number;
        limit: number;
        startDate?: string;
        endDate?: string;
        rating?: number;
        branchId?: string;
        hasCase?: boolean;
        search?: string;
    }): Promise<{
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
    private calculateRecoveryMetrics;
}
