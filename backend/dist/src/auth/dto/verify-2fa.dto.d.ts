export declare enum VerificationMethod {
    TOTP = "TOTP",
    EMAIL = "EMAIL",
    RECOVERY_CODE = "RECOVERY_CODE"
}
export declare class Verify2faDto {
    tempToken: string;
    method: VerificationMethod;
    code: string;
}
