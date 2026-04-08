import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum VerificationMethod {
  TOTP = 'TOTP',
  EMAIL = 'EMAIL',
  RECOVERY_CODE = 'RECOVERY_CODE',
}

export class Verify2faDto {
  @IsString()
  @IsNotEmpty({ message: 'Temporary token is required' })
  tempToken: string;

  @IsEnum(VerificationMethod, {
    message: 'Method must be one of: TOTP, EMAIL, RECOVERY_CODE',
  })
  @IsNotEmpty({ message: 'Verification method is required' })
  method: VerificationMethod;

  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  code: string;
}
