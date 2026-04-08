import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, Req, UseGuards, Param } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Aggressive anti-spam: max 5 submissions per IP per 60 seconds
  create(@Body() createFeedbackDto: CreateFeedbackDto, @Req() req: Request) {
    return this.feedbackService.submitFeedback(createFeedbackDto, req);
  }

  @Get('context/:token')
  @HttpCode(HttpStatus.OK)
  getTouchpointContext(@Param('token') token: string) {
    return this.feedbackService.getTouchpointContext(token);
  }

  @Get('explorer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.CX)
  getExplorer(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('rating') rating?: number,
    @Query('branchId') branchId?: string,
    @Query('hasCase') hasCase?: string,
    @Query('search') search?: string,
  ) {
    return this.feedbackService.getFeedbackExplorer(user, {
      page: Number(page),
      limit: Number(limit),
      startDate,
      endDate,
      rating,
      branchId,
      hasCase: hasCase === 'true' ? true : hasCase === 'false' ? false : undefined,
      search,
    });
  }
}
