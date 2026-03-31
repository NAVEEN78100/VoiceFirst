import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { TriggerFeedbackRequestDto } from './dto/trigger-feedback-request.dto';

/**
 * MessagingController
 * 
 * Provides an authorized gateway for staff and managers to 
 * initiate outbound messaging and feedback requests.
 */
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Triggers a feedback request (WhatsApp/SMS) for a specific touchpoint.
   */
  @Post('trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.MANAGER, Role.ADMIN)
  async trigger(
    @Request() req: any,
    @Body() dto: TriggerFeedbackRequestDto,
  ) {
    return this.messagingService.triggerFeedbackRequest(req.user, dto);
  }

  /**
   * WhatsApp webhook verification (GET challenge handshake).
   */
  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    return this.messagingService.verifyWebhook(mode, verifyToken, challenge);
  }

  /**
   * WhatsApp webhook delivery status callback.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    await this.messagingService.handleWhatsAppWebhook(payload);
    return { received: true };
  }
}
