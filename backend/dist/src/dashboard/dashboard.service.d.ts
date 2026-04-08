import { PrismaService } from '../prisma/prisma.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
export interface DashboardSummary {
    totalFeedback: number;
    averageRating: number;
    lowRatingCount: number;
    lowRatingPercentage: number;
    totalOpenCases: number;
    ratingDistribution: {
        rating: number;
        count: number;
    }[];
    casesByStatus: {
        status: string;
        count: number;
    }[];
}
export interface PerformanceChartData {
    date: string;
    avgRating: number;
    count: number;
}
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSummary(user: any, filters: DashboardFiltersDto): Promise<DashboardSummary>;
    getPerformanceTrend(user: any, filters: DashboardFiltersDto): Promise<PerformanceChartData[]>;
    getRecoveryMetrics(user: any, filters: DashboardFiltersDto): Promise<{
        totalRecovered: any;
        improvedCases: any;
        stagnantOrWorse: number;
        averageImprovement: number;
        improvementPercentage: number;
    }>;
    private resolveContext;
}
