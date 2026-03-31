import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTouchpointDto, UpdateTouchpointDto } from './dto/touchpoint.dto';

@Injectable()
export class TouchpointService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to evaluate RBAC read visibility for touchpoints
   */
  async findAll(user: any) {
    let whereCondition: any = {};

    if (user.role === 'ADMIN' || user.role === 'CX') {
      // Global View
      whereCondition = {};
    } else if (user.role === 'MANAGER') {
      // Branch-Limited View
      whereCondition = { branchId: user.branchId };
    } else if (user.role === 'STAFF') {
      // Staff-Limited View (Only touchpoints specifically assigned to them)
      whereCondition = { staffId: user.id };
    }

    return this.prisma.touchpoint.findMany({
      where: whereCondition,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        staff: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const touchpoint = await this.prisma.touchpoint.findUnique({
      where: { id },
      include: {
        branch: true,
        staff: { select: { id: true, email: true, role: true } },
      },
    });

    if (!touchpoint) {
      throw new NotFoundException(`Touchpoint not found`);
    }

    // Role-based authorization for single fetch
    if (user.role === 'MANAGER' && touchpoint.branchId !== user.branchId) {
      throw new ForbiddenException('You can only view touchpoints within your own branch.');
    }
    if (user.role === 'STAFF' && touchpoint.staffId !== user.id) {
      throw new ForbiddenException('You can only view your officially assigned touchpoints.');
    }

    return touchpoint;
  }

  async create(createTouchpointDto: CreateTouchpointDto, user: any) {
    // 1. Role Authorization
    if (user.role === 'STAFF' || user.role === 'CX') {
      throw new ForbiddenException('You do not have permission to provision new touchpoints.');
    }
    if (user.role === 'MANAGER' && createTouchpointDto.branchId !== user.branchId) {
      throw new ForbiddenException('Managers can only deploy touchpoints within their operational branch.');
    }

    // 2. Data Integrity: Validate Branch Existence
    const branchExists = await this.prisma.branch.findUnique({ where: { id: createTouchpointDto.branchId } });
    if (!branchExists) {
      throw new BadRequestException('The specified branch does not exist.');
    }

    // 3. Data Integrity: Validate Staff Assignment (Must be in the same branch)
    if (createTouchpointDto.staffId) {
      const staffMember = await this.prisma.user.findUnique({ where: { id: createTouchpointDto.staffId } });
      if (!staffMember) {
        throw new BadRequestException('Assigned staff member does not exist.');
      }
      if (staffMember.branchId !== createTouchpointDto.branchId) {
        throw new BadRequestException('Staff member must formally belong to the same branch as the created touchpoint to guarantee physical proximity linking.');
      }
    }

    // Provision Touchpoint
    return this.prisma.touchpoint.create({
      data: createTouchpointDto,
    });
  }

  async update(id: string, updateTouchpointDto: UpdateTouchpointDto, user: any) {
    const existing = await this.prisma.touchpoint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Touchpoint not found');

    // 1. Role Authorization
    if (user.role === 'STAFF' || user.role === 'CX') {
      throw new ForbiddenException('You do not have permission to modify touchpoints.');
    }
    if (user.role === 'MANAGER' && existing.branchId !== user.branchId) {
      throw new ForbiddenException('Managers can only modify touchpoints within their operational branch.');
    }

    // 2. Branch Constraints
    if (updateTouchpointDto.branchId && user.role === 'MANAGER' && updateTouchpointDto.branchId !== user.branchId) {
       throw new ForbiddenException('Managers cannot migrate touchpoints to other branches.');
    }

    // 3. Staff Reassignment Constraints
    const evalBranchId = updateTouchpointDto.branchId || existing.branchId;
    if (updateTouchpointDto.staffId) {
      const staffMember = await this.prisma.user.findUnique({ where: { id: updateTouchpointDto.staffId } });
      if (staffMember?.branchId !== evalBranchId) {
        throw new BadRequestException('Transferred staff member must belong to the same branch as this touchpoint.');
      }
    }

    return this.prisma.touchpoint.update({
      where: { id },
      data: updateTouchpointDto,
    });
  }

  async remove(id: string, user: any) {
    const existing = await this.prisma.touchpoint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Touchpoint not found');

    if (user.role === 'STAFF' || user.role === 'CX') {
      throw new ForbiddenException('Unauthorized to remove touchpoints.');
    }
    if (user.role === 'MANAGER' && existing.branchId !== user.branchId) {
      throw new ForbiddenException('Cannot remove a touchpoint governed by another branch.');
    }

    return this.prisma.touchpoint.delete({
      where: { id },
    });
  }
}
