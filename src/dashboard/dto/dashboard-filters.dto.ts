import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';

/**
 * Predefined filter presets for convenience
 */
export enum DashboardTimeBucket {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  CUSTOM = 'custom',
}

/**
 * Dashboard query filters
 */
export class DashboardFiltersDto {
  @IsEnum(DashboardTimeBucket)
  @IsOptional()
  preset?: DashboardTimeBucket = DashboardTimeBucket.LAST_7_DAYS;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  /**
   * For Admin/CX: filter for a specific branch.
   * For Managers: this will be forced to their own branchId.
   */
  @IsString()
  @IsOptional()
  branchId?: string;
}
