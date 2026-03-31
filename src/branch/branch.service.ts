import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: createBranchDto,
    });
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
