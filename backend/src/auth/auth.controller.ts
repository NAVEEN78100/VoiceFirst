import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const ipAddress =
      (req.headers?.['x-forwarded-for'] as string) ||
      req.socket?.remoteAddress ||
      undefined;

    const authRes = await this.authService.login(loginDto, ipAddress);

    if (authRes.accessToken) {
      res.cookie('access_token', authRes.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days limit
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      authRes.accessToken = undefined; // Remove from body
    }

    return authRes;
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verify2fa(@Body() verify2faDto: Verify2faDto, @Res({ passthrough: true }) res: any) {
    const authRes = await this.authService.verify2fa(verify2faDto);

    if (authRes.accessToken) {
      res.cookie('access_token', authRes.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days limit
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      authRes.accessToken = undefined; // Remove from body
    }

    return authRes;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token');
    return { message: 'Logged out securely' };
  }
}
