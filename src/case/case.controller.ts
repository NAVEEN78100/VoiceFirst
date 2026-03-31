import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { CaseService } from './case.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CaseStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * CaseController
 * 
 * Provides endpoints for viewing and managing support cases.
 * Strictly role-guarded to ensure data isolation.
 */
@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  /**
   * List all cases (Branch-aware / Staff-aware)
   */
  @Get()
  @Roles(Role.ADMIN, Role.CX, Role.MANAGER, Role.STAFF)
  async findAll(
    @CurrentUser() user: any,
    // @Query('status') status?: CaseStatus,
  ) {
    return this.caseService.findAll(user);
  }

  /**
   * Update case status or notes
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.CX, Role.MANAGER, Role.STAFF)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: CaseStatus,
    @Body('notes') notes?: string,
  ) {
    return this.caseService.updateStatus(id, status, user, notes);
  }
}
