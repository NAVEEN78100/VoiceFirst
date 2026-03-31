import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, Length } from 'class-validator';

export class CreateFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @Length(1, 1000)
  comment?: string;

  @IsString()
  @IsNotEmpty()
  touchpointToken: string;

  @IsString()
  @IsOptional()
  @Length(7, 20)
  phone?: string;

  @IsString()
  @IsOptional()
  @Length(8, 100)
  messageToken?: string;

  /**
   * Optional reference for Closed-Loop recovery.
   * Links a follow-up survey back to the original failure.
   */
  @IsString()
  @IsOptional()
  caseId?: string;
}
