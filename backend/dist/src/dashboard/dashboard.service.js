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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_filters_dto_1 = require("./dto/dashboard-filters.dto");
const role_enum_1 = require("../common/enums/role.enum");
const date_fns_1 = require("date-fns");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(user, filters) {
        try {
            const { dateRange, effectiveBranchId, effectiveStaffId } = this.resolveContext(user, filters);
            let touchpointIds = undefined;
            if (effectiveStaffId) {
                const staffTouchpoints = await this.prisma.touchpoint.findMany({
                    where: { staffId: effectiveStaffId },
                    select: { id: true }
                });
                touchpointIds = staffTouchpoints.map(t => t.id);
            }
            const whereFeedback = {};
            if (dateRange)
                whereFeedback.createdAt = dateRange;
            if (effectiveBranchId)
                whereFeedback.branchId = effectiveBranchId;
            if (touchpointIds)
                whereFeedback.touchpointId = { in: touchpointIds };
            const [feedbackAgg, distribution] = await Promise.all([
                this.prisma.feedback.aggregate({
                    where: whereFeedback,
                    _count: { id: true },
                    _avg: { rating: true },
                }),
                this.prisma.feedback.groupBy({
                    by: ['rating'],
                    where: whereFeedback,
                    _count: { id: true },
                }),
            ]);
            const caseWhere = {};
            if (effectiveBranchId)
                caseWhere.branchId = effectiveBranchId;
            if (touchpointIds)
                caseWhere.touchpointId = { in: touchpointIds };
            const casesAgg = await this.prisma.case.groupBy({
                by: ['status'],
                where: caseWhere,
                _count: { id: true },
            });
            const lowRatings = distribution
                .filter((d) => d.rating <= 2)
                .reduce((sum, d) => sum + d._count.id, 0);
            const totalCount = feedbackAgg._count.id || 0;
            const avgRating = feedbackAgg._avg.rating || 0;
            const activeStatuses = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'];
            const totalActive = casesAgg
                .filter((c) => activeStatuses.includes(c.status))
                .reduce((sum, c) => sum + c._count.id, 0);
            return {
                totalFeedback: totalCount,
                averageRating: parseFloat(avgRating.toFixed(2)),
                lowRatingCount: lowRatings,
                lowRatingPercentage: totalCount === 0 ? 0 : parseFloat(((lowRatings / totalCount) * 100).toFixed(1)),
                totalOpenCases: totalActive,
                ratingDistribution: distribution.map((d) => ({ rating: d.rating, count: d._count.id })),
                casesByStatus: casesAgg.map((c) => ({ status: c.status, count: c._count.id })),
            };
        }
        catch (err) {
            this.logger.error(`Critical Failure in getSummary: ${err.stack}`);
            throw err;
        }
    }
    async getPerformanceTrend(user, filters) {
        try {
            const { dateRange, effectiveBranchId, effectiveStaffId } = this.resolveContext(user, filters);
            let touchpointIds = undefined;
            if (effectiveStaffId) {
                const staffTouchpoints = await this.prisma.touchpoint.findMany({
                    where: { staffId: effectiveStaffId },
                    select: { id: true }
                });
                touchpointIds = staffTouchpoints.map(t => t.id);
            }
            const where = {};
            if (dateRange)
                where.createdAt = dateRange;
            if (effectiveBranchId)
                where.branchId = effectiveBranchId;
            if (touchpointIds)
                where.touchpointId = { in: touchpointIds };
            const data = await this.prisma.feedback.findMany({
                where,
                select: { createdAt: true, rating: true },
                orderBy: { createdAt: 'asc' },
            });
            const grouped = data.reduce((acc, f) => {
                const dateKey = f.createdAt.toISOString().split('T')[0];
                if (!acc[dateKey])
                    acc[dateKey] = { sum: 0, count: 0 };
                acc[dateKey].sum += f.rating;
                acc[dateKey].count += 1;
                return acc;
            }, {});
            return Object.entries(grouped).map(([date, stats]) => ({
                date,
                avgRating: parseFloat((stats.sum / stats.count).toFixed(2)),
                count: stats.count,
            }));
        }
        catch (err) {
            this.logger.error(`Critical Failure in getPerformanceTrend: ${err.stack}`);
            throw err;
        }
    }
    async getRecoveryMetrics(user, filters) {
        const { effectiveBranchId } = this.resolveContext(user, filters);
        const cases = await this.prisma.case.findMany({
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
        const improved = cases.filter((c) => (c.recoveryDelta || 0) > 0).length;
        const averageDelta = total > 0
            ? cases.reduce((sum, c) => sum + (c.recoveryDelta || 0), 0) / total
            : 0;
        return {
            totalRecovered: total,
            improvedCases: improved,
            stagnantOrWorse: total - improved,
            averageImprovement: parseFloat(averageDelta.toFixed(2)),
            improvementPercentage: total > 0 ? parseFloat(((improved / total) * 100).toFixed(1)) : 0
        };
    }
    resolveContext(user, filters) {
        let effectiveBranchId = filters.branchId;
        let effectiveStaffId = undefined;
        if (user.role === role_enum_1.Role.MANAGER) {
            if (!user.branchId) {
                throw new common_1.ForbiddenException('Manager has no assigned branch.');
            }
            effectiveBranchId = user.branchId;
        }
        else if (user.role === role_enum_1.Role.STAFF) {
            effectiveStaffId = user.id;
            effectiveBranchId = user.branchId;
        }
        else if (user.role !== role_enum_1.Role.ADMIN && user.role !== role_enum_1.Role.CX) {
            throw new common_1.ForbiddenException('You do not have permission to view dashboard metrics.');
        }
        let dateRange = undefined;
        if (filters.preset === dashboard_filters_dto_1.DashboardTimeBucket.TODAY) {
            dateRange = { gte: (0, date_fns_1.startOfDay)(new Date()), lte: (0, date_fns_1.endOfDay)(new Date()) };
        }
        else if (filters.preset === dashboard_filters_dto_1.DashboardTimeBucket.LAST_7_DAYS) {
            dateRange = { gte: (0, date_fns_1.subDays)(new Date(), 7) };
        }
        else if (filters.preset === dashboard_filters_dto_1.DashboardTimeBucket.LAST_30_DAYS) {
            dateRange = { gte: (0, date_fns_1.subDays)(new Date(), 30) };
        }
        else if (filters.preset === dashboard_filters_dto_1.DashboardTimeBucket.THIS_MONTH) {
            dateRange = { gte: (0, date_fns_1.startOfMonth)(new Date()) };
        }
        else if (filters.preset === dashboard_filters_dto_1.DashboardTimeBucket.CUSTOM && filters.startDate) {
            dateRange = {
                gte: new Date(filters.startDate),
                lte: filters.endDate ? new Date(filters.endDate) : undefined,
            };
        }
        return { dateRange, effectiveBranchId, effectiveStaffId };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map