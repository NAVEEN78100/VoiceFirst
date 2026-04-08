"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const role_enum_1 = require("../common/enums/role.enum");
const event_emitter_1 = require("@nestjs/event-emitter");
const events_constants_1 = require("../events/events.constants");
let CaseService = CaseService_1 = class CaseService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(CaseService_1.name);
    VALID_TRANSITIONS = {
        [client_1.CaseStatus.NEW]: [client_1.CaseStatus.ACKNOWLEDGED],
        [client_1.CaseStatus.ACKNOWLEDGED]: [client_1.CaseStatus.IN_PROGRESS],
        [client_1.CaseStatus.IN_PROGRESS]: [client_1.CaseStatus.RESOLVED],
        [client_1.CaseStatus.RESOLVED]: [client_1.CaseStatus.CLOSED],
        [client_1.CaseStatus.CLOSED]: [],
    };
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async findAll(user, status) {
        try {
            const where = {};
            if (status)
                where.status = status;
            if (user.role === role_enum_1.Role.MANAGER) {
                if (!user.branchId)
                    throw new common_1.ForbiddenException('Manager has no branch.');
                where.branchId = user.branchId;
            }
            else if (user.role === role_enum_1.Role.STAFF) {
                where.touchpoint = { staffId: user.id };
            }
            return await this.prisma.case.findMany({
                where,
                include: {
                    feedback: {
                        select: {
                            comment: true,
                            issueTopic: true,
                            phone: true,
                            ipAddress: true,
                            deviceType: true,
                            browser: true,
                            os: true,
                            createdAt: true,
                            touchpoint: { select: { name: true, type: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (err) {
            this.logger.error(`Critical Failure in findAll: ${err.message}`, err.stack);
            throw err;
        }
    }
    async updateStatus(id, newStatus, user, notes) {
        const existingCase = await this.prisma.case.findUnique({
            where: { id },
            include: { feedback: { select: { phone: true } } }
        });
        if (!existingCase)
            throw new common_1.NotFoundException('Case not found.');
        if (user.role === role_enum_1.Role.MANAGER && existingCase.branchId !== user.branchId) {
            throw new common_1.ForbiddenException('Access Denied.');
        }
        if (user.role === role_enum_1.Role.STAFF) {
            const touchpoint = await this.prisma.touchpoint.findUnique({
                where: { id: existingCase.touchpointId },
                select: { staffId: true }
            });
            if (touchpoint?.staffId !== user.id) {
                throw new common_1.ForbiddenException('This case belongs to another staff member.');
            }
        }
        const currentStatus = existingCase.status;
        if (currentStatus === client_1.CaseStatus.CLOSED)
            throw new common_1.BadRequestException('Case is CLOSED.');
        const allowed = this.VALID_TRANSITIONS[currentStatus];
        if (!allowed.includes(newStatus)) {
            throw new common_1.BadRequestException(`Invalid move: ${currentStatus} -> ${newStatus}`);
        }
        const updateData = { status: newStatus, notes: notes || undefined };
        if (newStatus === client_1.CaseStatus.RESOLVED && !existingCase.resolvedAt) {
            updateData.resolvedAt = new Date();
        }
        const updated = await this.prisma.case.update({
            where: { id },
            data: updateData,
        });
        if (newStatus === client_1.CaseStatus.RESOLVED) {
            this.logger.log(`[CaseService] Case ${id} resolved. Emitting recovery event.`);
            this.eventEmitter.emit(events_constants_1.EVENTS.CASE_RESOLVED, {
                caseId: id,
                branchId: existingCase.branchId,
                touchpointId: existingCase.touchpointId,
                phone: existingCase.feedback.phone,
            });
        }
        return updated;
    }
    async createCaseForFeedback(input) {
        try {
            const existingCase = await this.prisma.case.findUnique({
                where: { feedbackId: input.feedbackId },
                select: { id: true },
            });
            if (existingCase)
                return { created: false, caseId: existingCase.id };
            const newCase = await this.prisma.case.create({
                data: {
                    feedbackId: input.feedbackId,
                    branchId: input.branchId,
                    touchpointId: input.touchpointId,
                    initialRating: input.rating,
                    priority: input.rating === 1 ? 'CRITICAL' : 'HIGH',
                    status: client_1.CaseStatus.NEW,
                    canContact: input.hasPhone,
                },
                select: { id: true },
            });
            return { created: true, caseId: newCase.id };
        }
        catch (err) {
            this.logger.error(`[CaseService] Production Failure: ${err}`);
            throw err;
        }
    }
};
exports.CaseService = CaseService;
exports.CaseService = CaseService = CaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], CaseService);
//# sourceMappingURL=case.service.js.map