import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardFiltersDto, DashboardTimeBucket } from './dto/dashboard-filters.dto';
import { Role } from '../common/enums/role.enum';
import { subDays, startOfDay, endOfDay, startOfMonth } from 'date-fns';

/**
 * Result structure for the main summary dashboard (cards)
 */
export interface DashboardSummary {
  totalFeedback: number;
  averageRating: number;
  lowRatingCount: number; // 1 or 2
  lowRatingPercentage: number;
  totalOpenCases: number;
  ratingDistribution: { rating: number; count: number }[];
  casesByStatus: { status: string; count: number }[];
}

/**
 * Result structure for chart data (periodic)
 */
export interface PerformanceChartData {
  date: string;
  avgRating: number;
  count: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates aggregated summary statistics optimized for dashboard cards.
   *
   * @param user - The authenticated requestor
   * @param filters - Time range and branch filters
   */
  async getSummary(user: any, filters: DashboardFiltersDto): Promise<DashboardSummary> {
    try {
      const { dateRange, effectiveBranchId, effectiveStaffId } = this.resolveContext(user, filters);

      // 1. Resolve Touchpoint IDs for Staff filtering (Prisma aggregate/groupBy requirement)
      let touchpointIds: string[] | undefined = undefined;
      if (effectiveStaffId) {
        const staffTouchpoints = await this.prisma.touchpoint.findMany({
          where: { staffId: effectiveStaffId },
          select: { id: true }
        });
        touchpointIds = staffTouchpoints.map(t => t.id);
      }

      // 2. Build explicit where clauses (No relation objects)
      const whereFeedback: any = {};
      if (dateRange) whereFeedback.createdAt = dateRange;
      if (effectiveBranchId) whereFeedback.branchId = effectiveBranchId;
      if (touchpointIds) whereFeedback.touchpointId = { in: touchpointIds };

      const [feedbackAgg, distribution]: [any, any] = await Promise.all([
        // A. Feedback Totals + Avg Rating
        this.prisma.feedback.aggregate({
          where: whereFeedback,
          _count: { id: true },
          _avg: { rating: true },
        }),

        // B. Rating Distribution (Group by)
        this.prisma.feedback.groupBy({
          by: ['rating'],
          where: whereFeedback,
          _count: { id: true },
        }),
      ]);

      const caseWhere: any = {};
      if (effectiveBranchId) caseWhere.branchId = effectiveBranchId;
      if (touchpointIds) caseWhere.touchpointId = { in: touchpointIds };

      const casesAgg: any = await this.prisma.case.groupBy({
        by: ['status'],
        where: caseWhere,
        _count: { id: true },
      });

      // 2. Compute specific low-rating count (1 & 2)
      const lowRatings = (distribution as any[])
        .filter((d) => d.rating <= 2)
        .reduce((sum: number, d) => sum + d._count.id, 0);

      const totalCount = feedbackAgg._count.id || 0;
      const avgRating = feedbackAgg._avg.rating || 0;

      // Active cases includes all non-terminal states
      const activeStatuses = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'];
      const totalActive = (casesAgg as any[])
        .filter((c) => activeStatuses.includes(c.status))
        .reduce((sum, c) => sum + c._count.id, 0);

      return {
        totalFeedback: totalCount,
        averageRating: parseFloat(avgRating.toFixed(2)),
        lowRatingCount: lowRatings,
        lowRatingPercentage: totalCount === 0 ? 0 : parseFloat(((lowRatings / totalCount) * 100).toFixed(1)),
        totalOpenCases: totalActive,
        ratingDistribution: (distribution as any[]).map((d) => ({ rating: d.rating, count: d._count.id })),
        casesByStatus: (casesAgg as any[]).map((c) => ({ status: c.status, count: c._count.id })),
      };
    } catch (err) {
      this.logger.error(`Critical Failure in getSummary: ${err.stack}`);
      throw err;
    }
  }

  /**
   * Generates performance chart data (Daily rating trend).
   */
  async getPerformanceTrend(user: any, filters: DashboardFiltersDto): Promise<PerformanceChartData[]> {
    try {
      const { dateRange, effectiveBranchId, effectiveStaffId } = this.resolveContext(user, filters);

      // Resolve Touchpoint IDs to avoid relation filters in raw-like findMany if needed
      // (Though findMany supports it, consistency is better here)
      let touchpointIds: string[] | undefined = undefined;
      if (effectiveStaffId) {
        const staffTouchpoints = await this.prisma.touchpoint.findMany({
          where: { staffId: effectiveStaffId },
          select: { id: true }
        });
        touchpointIds = staffTouchpoints.map(t => t.id);
      }

      const where: any = {};
      if (dateRange) where.createdAt = dateRange;
      if (effectiveBranchId) where.branchId = effectiveBranchId;
      if (touchpointIds) where.touchpointId = { in: touchpointIds };

      const data = await this.prisma.feedback.findMany({
        where,
        select: { createdAt: true, rating: true },
        orderBy: { createdAt: 'asc' },
      });

      // Grouping logic in-memory (optimized for small to mid-size chunks)
      const grouped = data.reduce(
        (acc: Record<string, { sum: number; count: number }>, f: { createdAt: Date, rating: number }) => {
          const dateKey = f.createdAt.toISOString().split('T')[0];
          if (!acc[dateKey]) acc[dateKey] = { sum: 0, count: 0 };
          acc[dateKey].sum += f.rating;
          acc[dateKey].count += 1;
          return acc;
        },
        {},
      );

      return Object.entries(grouped).map(([date, stats]) => ({
        date,
        avgRating: parseFloat((stats.sum / stats.count).toFixed(2)),
        count: stats.count,
      }));
    } catch (err) {
      this.logger.error(`Critical Failure in getPerformanceTrend: ${err.stack}`);
      throw err;
    }
  }

  /**
   * Calculates "Closed-Loop" recovery metrics across the organization.
   */
  async getRecoveryMetrics(user: any, filters: DashboardFiltersDto) {
    const { effectiveBranchId } = this.resolveContext(user, filters);
    
    const cases = await (this.prisma as any).case.findMany({
      where: {
        branchId: effectiveBranchId,
        recoveryDelta: { not: null }
      },
      select: {
        initialRating: true,
        followUpRating: true,
        recoveryDelta: true
      }
    });

    const total = cases.length;
    const improved = cases.filter((c: any) => (c.recoveryDelta || 0) > 0).length;
    const averageDelta = total > 0 
      ? cases.reduce((sum: number, c: any) => sum + (c.recoveryDelta || 0), 0) / total 
      : 0;

    return {
      totalRecovered: total,
      improvedCases: improved,
      stagnantOrWorse: total - improved,
      averageImprovement: parseFloat(averageDelta.toFixed(2)),
      improvementPercentage: total > 0 ? parseFloat(((improved / total) * 100).toFixed(1)) : 0
    };
  }

  /**
   * Resolves the security context (RBAC) and date ranges.
   * Guarantees that users cannot see data they aren't privileged for.
   */
  private resolveContext(user: any, filters: DashboardFiltersDto) {
    let effectiveBranchId = filters.branchId;
    let effectiveStaffId: string | undefined = undefined;

    // RBAC Enforcement
    if (user.role === Role.MANAGER) {
      // Managers are forced to their assigned branch
      if (!user.branchId) {
        throw new ForbiddenException('Manager has no assigned branch.');
      }
      effectiveBranchId = user.branchId;
    } else if (user.role === Role.STAFF) {
      // Staff see their own touchpoints
      effectiveStaffId = user.id;
      effectiveBranchId = user.branchId; // also limit to their branch
    } else if (user.role !== Role.ADMIN && user.role !== Role.CX) {
      // Default fallback
      throw new ForbiddenException('You do not have permission to view dashboard metrics.');
    }

    // Date Range Resolution
    let dateRange = undefined;
    if (filters.preset === DashboardTimeBucket.TODAY) {
      dateRange = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
    } else if (filters.preset === DashboardTimeBucket.LAST_7_DAYS) {
      dateRange = { gte: subDays(new Date(), 7) };
    } else if (filters.preset === DashboardTimeBucket.LAST_30_DAYS) {
      dateRange = { gte: subDays(new Date(), 30) };
    } else if (filters.preset === DashboardTimeBucket.THIS_MONTH) {
      dateRange = { gte: startOfMonth(new Date()) };
    } else if (filters.preset === DashboardTimeBucket.CUSTOM && filters.startDate) {
      dateRange = {
        gte: new Date(filters.startDate),
        lte: filters.endDate ? new Date(filters.endDate) : undefined,
      };
    }

    return { dateRange, effectiveBranchId, effectiveStaffId };
  }
}
