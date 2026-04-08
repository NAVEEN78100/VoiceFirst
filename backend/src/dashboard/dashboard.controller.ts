import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

/**
 * DashboardController
 * 
 * Provides real-time metrics for UI dashboard components.
 * Consumed by cards, charts, and ranked lists.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Summary Statistics (Cards)
   * 
   * Provides:
   * - Total Submissions
   * - Avg Rating
   * - Low Rating count/percentage
   * - Open Cases count
   * - Distribution counts for 1-5
   * - Breakdown of case statuses
   */
  @Get('summary')
  @Roles(Role.ADMIN, Role.CX, Role.MANAGER, Role.STAFF)
  getSummary(@Request() req: any, @Query() filters: DashboardFiltersDto) {
    return this.dashboardService.getSummary(req.user, filters);
  }

  /**
   * Performance Trend (Chart)
   * 
   * Provides:
   * - Daily aggregate ratings over time
   * - Submission volume over time
   */
  @Get('performance-trend')
  @Roles(Role.ADMIN, Role.CX, Role.MANAGER, Role.STAFF)
  getPerformanceTrend(@Request() req: any, @Query() filters: DashboardFiltersDto) {
    return this.dashboardService.getPerformanceTrend(req.user, filters);
  }

  /**
   * Closed-Loop Recovery Metrics
   */
  @Get('recovery')
  @Roles(Role.ADMIN, Role.CX, Role.MANAGER, Role.STAFF)
  getRecoveryMetrics(@Request() req: any, @Query() filters: DashboardFiltersDto) {
    return this.dashboardService.getRecoveryMetrics(req.user, filters);
  }
}
