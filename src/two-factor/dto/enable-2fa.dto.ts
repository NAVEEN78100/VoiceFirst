import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TwoFactorSetupMethod {
  TOTP = 'TOTP',
  EMAIL = 'EMAIL',
}

export class Enable2faDto {
  @IsEnum(TwoFactorSetupMethod, {
    message: 'Method must be one of: TOTP, EMAIL',
  })
  @IsNotEmpty({ message: '2FA method is required' })
  method: TwoFactorSetupMethod;
}

export class VerifyTotpSetupDto {
  @IsString()
  @IsNotEmpty({ message: 'TOTP code is required for verification' })
  code: string;
}

export class Disable2faDto {
  @IsString()
  @IsNotEmpty({ message: 'Password is required to disable 2FA' })
  password: string;
}
