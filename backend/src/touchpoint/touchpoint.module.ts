import { Module } from '@nestjs/common';
import { TouchpointService } from './touchpoint.service';
import { TouchpointController } from './touchpoint.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TouchpointController],
  providers: [TouchpointService],
  exports: [TouchpointService],
})
export class TouchpointModule {}
