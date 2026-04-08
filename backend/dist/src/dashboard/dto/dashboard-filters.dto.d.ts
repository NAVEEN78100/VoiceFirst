export declare enum DashboardTimeBucket {
    TODAY = "today",
    LAST_7_DAYS = "last_7_days",
    LAST_30_DAYS = "last_30_days",
    THIS_MONTH = "this_month",
    CUSTOM = "custom"
}
export declare class DashboardFiltersDto {
    preset?: DashboardTimeBucket;
    startDate?: string;
    endDate?: string;
    branchId?: string;
}
