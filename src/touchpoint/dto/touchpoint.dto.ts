import { IsString, IsNotEmpty, IsIn, IsOptional, IsBoolean } from 'class-validator';

export class CreateTouchpointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['BRANCH_DESK', 'STAFF', 'ATM', 'OTHER'])
  @IsOptional()
  type?: any;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTouchpointDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsIn(['BRANCH_DESK', 'STAFF', 'ATM', 'OTHER'])
  @IsOptional()
  type?: any;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
