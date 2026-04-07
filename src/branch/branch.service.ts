import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    try {
      return await this.prisma.branch.create({
        data: createBranchDto,
      });
    } catch (error: any) {
      // Specifically handle unique constraint (Prisma Error P2002)
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'code';
        throw new ConflictException(`A branch with this ${field} already exists.`);
      }
      
      throw new BadRequestException(error.message || 'Failed to create branch');
    }
  }

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { touchpoints: true, users: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        touchpoints: true,
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    try {
      return await this.prisma.branch.update({
        where: { id },
        data: updateBranchDto,
      });
    } catch (error) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.branch.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
  }
}
