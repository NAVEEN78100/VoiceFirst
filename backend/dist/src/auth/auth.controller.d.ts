import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any, res: any): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    verify2fa(verify2faDto: Verify2faDto, res: any): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    logout(res: any): {
        message: string;
    };
}
