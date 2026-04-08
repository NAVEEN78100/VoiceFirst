import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseInput, CreateCaseResult } from './interfaces/case.interfaces';
import { CaseStatus } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class CaseService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    private readonly VALID_TRANSITIONS;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    findAll(user: {
        id: string;
        role: Role;
        branchId?: string | null;
    }, status?: CaseStatus): Promise<({
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
    updateStatus(id: string, newStatus: CaseStatus, user: {
        id: string;
        role: Role;
        branchId?: string | null;
    }, notes?: string): Promise<{
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
    createCaseForFeedback(input: CreateCaseInput): Promise<CreateCaseResult>;
}
