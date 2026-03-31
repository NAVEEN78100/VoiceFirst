import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TouchpointService } from './touchpoint.service';
import { CreateTouchpointDto, UpdateTouchpointDto } from './dto/touchpoint.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('touchpoints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TouchpointController {
  constructor(private readonly touchpointService: TouchpointService) {}

  @Post()
  create(
    @Body() createTouchpointDto: CreateTouchpointDto,
    @CurrentUser() user: any,
  ) {
    return this.touchpointService.create(createTouchpointDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    // Service handles precise data-level filtering based on User's branch/role
    return this.touchpointService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.touchpointService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTouchpointDto: UpdateTouchpointDto,
    @CurrentUser() user: any,
  ) {
    return this.touchpointService.update(id, updateTouchpointDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.touchpointService.remove(id, user);
  }
}
