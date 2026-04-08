import { CaseService } from './case.service';
import { CaseStatus } from '@prisma/client';
export declare class CaseController {
    private readonly caseService;
    constructor(caseService: CaseService);
    findAll(user: any): Promise<({
        feedback: {
            createdAt: Date;
            touchpoint: {
                name: string;
                type: import("@prisma/client").$Enums.TouchpointType;
            };
            ipAddress: string | null;
            phone: string | null;
            comment: string | null;
            issueTopic: string | null;
            deviceType: string | null;
            browser: string | null;
            os: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        touchpointId: string;
        feedbackId: string;
        initialRating: number;
        followUpRating: number | null;
        recoveryDelta: number | null;
        priority: import("@prisma/client").$Enums.CasePriority;
        canContact: boolean;
        notes: string | null;
        resolvedAt: Date | null;
    })[]>;
    update(id: string, user: any, status: CaseStatus, notes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        touchpointId: string;
        feedbackId: string;
        initialRating: number;
        followUpRating: number | null;
        recoveryDelta: number | null;
        priority: import("@prisma/client").$Enums.CasePriority;
        canContact: boolean;
        notes: string | null;
        resolvedAt: Date | null;
    }>;
}
