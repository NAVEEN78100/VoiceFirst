import { Module } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CaseModule
 *
 * Owns the case management domain. Provides CaseService
 * for automated creation and CaseController for UI interactions.
 */
@Module({
  imports: [PrismaModule],
  providers: [CaseService],
  controllers: [CaseController],
  exports: [CaseService],
})
export class CaseModule {}
