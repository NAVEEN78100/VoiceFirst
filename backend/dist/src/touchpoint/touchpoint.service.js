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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TouchpointService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TouchpointService = class TouchpointService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(user) {
        let whereCondition = {};
        if (user.role === 'ADMIN' || user.role === 'CX') {
            whereCondition = {};
        }
        else if (user.role === 'MANAGER') {
            whereCondition = { branchId: user.branchId };
        }
        else if (user.role === 'STAFF') {
            whereCondition = { staffId: user.id };
        }
        try {
            console.log(`[TouchpointService] findAll for user:`, user.email, 'Role:', user.role, 'Filter:', JSON.stringify(whereCondition));
            const touchpoints = await this.prisma.touchpoint.findMany({
                where: whereCondition,
                include: {
                    branch: { select: { id: true, name: true, code: true } },
                    staff: { select: { id: true, email: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
            console.log(`[TouchpointService] Found ${touchpoints.length} touchpoints`);
            return touchpoints;
        }
        catch (error) {
            console.error('[TouchpointService] Error in findAll:', error.message, error.stack);
            throw error;
        }
    }
    async findOne(id, user) {
        const touchpoint = await this.prisma.touchpoint.findUnique({
            where: { id },
            include: {
                branch: true,
                staff: { select: { id: true, email: true, role: true } },
            },
        });
        if (!touchpoint) {
            throw new common_1.NotFoundException(`Touchpoint not found`);
        }
        if (user.role === 'MANAGER' && touchpoint.branchId !== user.branchId) {
            throw new common_1.ForbiddenException('You can only view touchpoints within your own branch.');
        }
        if (user.role === 'STAFF' && touchpoint.staffId !== user.id) {
            throw new common_1.ForbiddenException('You can only view your officially assigned touchpoints.');
        }
        return touchpoint;
    }
    async findByToken(token) {
        const touchpoint = await this.prisma.touchpoint.findUnique({
            where: { token },
            include: {
                branch: {
                    select: { name: true, location: true }
                }
            }
        });
        if (!touchpoint) {
            throw new common_1.NotFoundException('Touchpoint link is invalid or has been decommissioned.');
        }
        return {
            name: touchpoint.name,
            type: touchpoint.type,
            branch: touchpoint.branch
        };
    }
    async create(createTouchpointDto, user) {
        if (user.role === 'STAFF' || user.role === 'CX') {
            throw new common_1.ForbiddenException('You do not have permission to provision new touchpoints.');
        }
        if (user.role === 'MANAGER' && createTouchpointDto.branchId !== user.branchId) {
            throw new common_1.ForbiddenException('Managers can only deploy touchpoints within their operational branch.');
        }
        const branchExists = await this.prisma.branch.findUnique({ where: { id: createTouchpointDto.branchId } });
        if (!branchExists) {
            throw new common_1.BadRequestException('The specified branch does not exist.');
        }
        if (createTouchpointDto.staffId) {
            const staffMember = await this.prisma.user.findUnique({ where: { id: createTouchpointDto.staffId } });
            if (!staffMember) {
                throw new common_1.BadRequestException('Assigned staff member does not exist.');
            }
            if (staffMember.branchId && staffMember.branchId !== createTouchpointDto.branchId) {
                throw new common_1.BadRequestException('Staff member must formally belong to the same branch as the created touchpoint to guarantee physical proximity linking.');
            }
        }
        try {
            return await this.prisma.touchpoint.create({
                data: {
                    ...createTouchpointDto,
                    staffId: createTouchpointDto.staffId || null,
                },
            });
        }
        catch (error) {
            console.error('[Touchpoint Creation FULL ERROR]:', {
                code: error.code,
                message: error.message,
                stack: error.stack,
                meta: error.meta
            });
            if (error.code === 'P2002')
                throw new common_1.BadRequestException('A touchpoint with this unique token already exists.');
            if (error.code === 'P2003')
                throw new common_1.BadRequestException('Constraint violation: Ensure branch and staff IDs are valid.');
            throw error;
        }
    }
    async update(id, updateTouchpointDto, user) {
        const existing = await this.prisma.touchpoint.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Touchpoint not found');
        if (user.role === 'STAFF' || user.role === 'CX') {
            throw new common_1.ForbiddenException('You do not have permission to modify touchpoints.');
        }
        if (user.role === 'MANAGER' && existing.branchId !== user.branchId) {
            throw new common_1.ForbiddenException('Managers can only modify touchpoints within their operational branch.');
        }
        if (updateTouchpointDto.branchId && user.role === 'MANAGER' && updateTouchpointDto.branchId !== user.branchId) {
            throw new common_1.ForbiddenException('Managers cannot migrate touchpoints to other branches.');
        }
        const evalBranchId = updateTouchpointDto.branchId || existing.branchId;
        if (updateTouchpointDto.staffId) {
            const staffMember = await this.prisma.user.findUnique({ where: { id: updateTouchpointDto.staffId } });
            if (staffMember?.branchId !== evalBranchId) {
                throw new common_1.BadRequestException('Transferred staff member must belong to the same branch as this touchpoint.');
            }
        }
        return this.prisma.touchpoint.update({
            where: { id },
            data: {
                ...updateTouchpointDto,
                staffId: updateTouchpointDto.staffId === "" ? null : (updateTouchpointDto.staffId || undefined),
            }
        });
    }
    async remove(id, user) {
        const existing = await this.prisma.touchpoint.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Touchpoint not found');
        if (user.role === 'STAFF' || user.role === 'CX') {
            throw new common_1.ForbiddenException('Unauthorized to remove touchpoints.');
        }
        if (user.role === 'MANAGER' && existing.branchId !== user.branchId) {
            throw new common_1.ForbiddenException('Cannot remove a touchpoint governed by another branch.');
        }
        return this.prisma.touchpoint.delete({
            where: { id },
        });
    }
};
exports.TouchpointService = TouchpointService;
exports.TouchpointService = TouchpointService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TouchpointService);
//# sourceMappingURL=touchpoint.service.js.map