import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * DashboardModule
 * 
 * Provides metrics and dashboard summary stats for the platform.
 * Decoupled: it only READS from Feedback, Case, and related modules.
 * Scaling: Optimized for read-intensive, real-time requests.
 */
@Module({
  imports: [PrismaModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
