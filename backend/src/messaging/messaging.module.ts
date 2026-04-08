import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaseResolvedListener } from './case-resolved.listener';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { SmsProvider } from './providers/sms.provider';

@Module({
  imports: [PrismaModule],
  providers: [MessagingService, CaseResolvedListener, WhatsAppProvider, SmsProvider],
  controllers: [MessagingController],
  exports: [MessagingService]
})
export class MessagingModule {}
