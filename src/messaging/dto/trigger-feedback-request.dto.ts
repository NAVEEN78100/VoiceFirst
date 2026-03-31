import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class TriggerFeedbackRequestDto {
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid E.164-compatible number',
  })
  phone!: string;

  @IsUUID()
  touchpointId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  customerRef?: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;
}
