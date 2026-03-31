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
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @Roles(Role.ADMIN) // Only ADMIN can create a global branch
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  findAll() {
    // Accessible by all authenticated users (to view their scope of operations)
    return this.branchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Only ADMIN can modify branch configurations
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
