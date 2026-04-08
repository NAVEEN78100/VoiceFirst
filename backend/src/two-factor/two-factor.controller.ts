import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import {
  Enable2faDto,
  VerifyTotpSetupDto,
  Disable2faDto,
  TwoFactorSetupMethod,
} from './dto/enable-2fa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Get current 2FA status
   */
  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.twoFactorService.get2faStatus(userId);
  }

  /**
   * Initiate 2FA setup
   */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async setup(
    @CurrentUser('id') userId: string,
    @Body() enable2faDto: Enable2faDto,
  ) {
    if (enable2faDto.method === TwoFactorSetupMethod.TOTP) {
      return this.twoFactorService.generateTotpSecret(userId);
    } else if (enable2faDto.method === TwoFactorSetupMethod.EMAIL) {
      return this.twoFactorService.enableEmail2fa(userId);
    }
  }

  /**
   * Verify TOTP setup (confirm authenticator app is working)
   */
  @Post('verify-totp-setup')
  @HttpCode(HttpStatus.OK)
  async verifyTotpSetup(
    @CurrentUser('id') userId: string,
    @Body() verifyDto: VerifyTotpSetupDto,
  ) {
    return this.twoFactorService.verifyAndEnableTotp(userId, verifyDto.code);
  }

  /**
   * Send email OTP (used during login 2FA flow)
   */
  @Post('send-email-otp')
  @HttpCode(HttpStatus.OK)
  async sendEmailOtp(@CurrentUser('id') userId: string) {
    return this.twoFactorService.generateEmailOtp(userId);
  }

  /**
   * Regenerate recovery codes
   */
  @Post('regenerate-recovery-codes')
  @HttpCode(HttpStatus.OK)
  async regenerateRecoveryCodes(
    @CurrentUser('id') userId: string,
    @Body('password') password: string,
  ) {
    const codes = await this.twoFactorService.regenerateRecoveryCodes(
      userId,
      password,
    );
    return {
      recoveryCodes: codes,
      warning: 'Save these recovery codes in a safe place. They will not be shown again.',
    };
  }

  /**
   * Disable 2FA
   */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disable(
    @CurrentUser('id') userId: string,
    @Body() disable2faDto: Disable2faDto,
  ) {
    return this.twoFactorService.disable2fa(userId, disable2faDto.password);
  }
}
