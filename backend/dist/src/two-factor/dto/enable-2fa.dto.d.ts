export declare enum TwoFactorSetupMethod {
    TOTP = "TOTP",
    EMAIL = "EMAIL"
}
export declare class Enable2faDto {
    method: TwoFactorSetupMethod;
}
export declare class VerifyTotpSetupDto {
    code: string;
}
export declare class Disable2faDto {
    password: string;
}
