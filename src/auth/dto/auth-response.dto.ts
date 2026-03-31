export class AuthResponseDto {
  accessToken?: string;
  requiresTwoFactor?: boolean;
  tempToken?: string;
  twoFactorMethod?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    branchId?: string | null;
  };
}
