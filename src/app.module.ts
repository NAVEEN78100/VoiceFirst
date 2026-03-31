import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { BranchModule } from './branch/branch.module';
import { TouchpointModule } from './touchpoint/touchpoint.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CaseModule } from './case/case.module';
import { EventsModule } from './events/events.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 1000,
          limit: 1000,
        },
      ],
    }),

    EventEmitterModule.forRoot({ wildcard: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    TwoFactorModule,
    BranchModule,
    TouchpointModule,
    FeedbackModule,
    DashboardModule,
    CaseModule,
    EventsModule,
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
