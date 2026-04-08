import { DashboardService } from './dashboard.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(req: any, filters: DashboardFiltersDto): Promise<import("./dashboard.service").DashboardSummary>;
    getPerformanceTrend(req: any, filters: DashboardFiltersDto): Promise<import("./dashboard.service").PerformanceChartData[]>;
    getRecoveryMetrics(req: any, filters: DashboardFiltersDto): Promise<{
        totalRecovered: any;
        improvedCases: any;
        stagnantOrWorse: number;
        averageImprovement: number;
        improvementPercentage: number;
    }>;
}
