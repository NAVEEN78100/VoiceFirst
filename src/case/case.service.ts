import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseInput, CreateCaseResult } from './interfaces/case.interfaces';
import { CaseStatus } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '../events/events.constants';

/**
 * CaseService
 *
 * Manages the lifecycle of support cases and tracks recovery metrics.
 */
@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  private readonly VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
    [CaseStatus.NEW]: [CaseStatus.ACKNOWLEDGED],
    [CaseStatus.ACKNOWLEDGED]: [CaseStatus.IN_PROGRESS],
    [CaseStatus.IN_PROGRESS]: [CaseStatus.RESOLVED],
    [CaseStatus.RESOLVED]: [CaseStatus.CLOSED],
    [CaseStatus.CLOSED]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Retrieves cases with RBAC filtering.
   */
  async findAll(user: { id: string; role: Role; branchId?: string | null }, status?: CaseStatus) {
    try {
      const where: any = {};
      if (status) where.status = status;

      if (user.role === Role.MANAGER) {
        if (!user.branchId) throw new ForbiddenException('Manager has no branch.');
        where.branchId = user.branchId;
      } else if (user.role === Role.STAFF) {
        // Direct relation filtering in findMany
        where.touchpoint = { staffId: user.id };
      }

      return await this.prisma.case.findMany({
        where,
        include: {
          feedback: {
            select: {
              comment: true,
              phone: true,
              touchpoint: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      this.logger.error(`Critical Failure in findAll: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Updates case status with lifecycle validation and recovery tracking.
   */
  async updateStatus(
    id: string,
    newStatus: CaseStatus,
    user: { id: string; role: Role; branchId?: string | null },
    notes?: string,
  ) {
    const existingCase = await this.prisma.case.findUnique({
      where: { id },
      include: { feedback: { select: { phone: true } } }
    });

    if (!existingCase) throw new NotFoundException('Case not found.');

    // 1. Isolation
    if (user.role === Role.MANAGER && existingCase.branchId !== user.branchId) {
      throw new ForbiddenException('Access Denied.');
    }

    if (user.role === Role.STAFF) {
      // Staff can only update if the case is linked to their touchpoint
      const touchpoint = await this.prisma.touchpoint.findUnique({
        where: { id: existingCase.touchpointId },
        select: { staffId: true }
      });
      if (touchpoint?.staffId !== user.id) {
        throw new ForbiddenException('This case belongs to another staff member.');
      }
    }

    // 2. State Machine
    const currentStatus = existingCase.status as CaseStatus;
    if (currentStatus === CaseStatus.CLOSED) throw new BadRequestException('Case is CLOSED.');

    const allowed = this.VALID_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Invalid move: ${currentStatus} -> ${newStatus}`);
    }

    // 3. Metadata
    const updateData: any = { status: newStatus, notes: notes || undefined };

    if (newStatus === CaseStatus.RESOLVED && !existingCase.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.case.update({
      where: { id },
      data: updateData,
    });

    // 4. Closed-Loop Trigger (Part 2)
    if (newStatus === CaseStatus.RESOLVED) {
      this.logger.log(`[CaseService] Case ${id} resolved. Emitting recovery event.`);
      this.eventEmitter.emit(EVENTS.CASE_RESOLVED, {
        caseId: id,
        branchId: existingCase.branchId,
        touchpointId: existingCase.touchpointId,
        phone: existingCase.feedback.phone,
      });
    }

    return updated;
  }

  /**
   * Creates a new case for low-rating feedback.
   */
  async createCaseForFeedback(input: CreateCaseInput): Promise<CreateCaseResult> {
    try {
      const existingCase = await this.prisma.case.findUnique({
        where: { feedbackId: input.feedbackId },
        select: { id: true },
      });

      if (existingCase) return { created: false, caseId: existingCase.id };

      const newCase = await this.prisma.case.create({
        data: {
          feedbackId: input.feedbackId,
          branchId: input.branchId,
          touchpointId: input.touchpointId,
          initialRating: input.rating, // Renamed in schema
          priority: input.rating === 1 ? 'CRITICAL' : 'HIGH',
          status: CaseStatus.NEW,
          canContact: input.hasPhone,
        },
        select: { id: true },
      });

      return { created: true, caseId: newCase.id };
    } catch (err: unknown) {
      this.logger.error(`[CaseService] Production Failure: ${err}`);
      throw err;
    }
  }
}
