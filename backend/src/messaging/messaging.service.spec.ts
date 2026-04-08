import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { SmsProvider } from './providers/sms.provider';

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: PrismaService,
          useValue: {
            messageLog: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => fallback),
          },
        },
        {
          provide: WhatsAppProvider,
          useValue: {
            sendTextMessage: jest.fn(),
          },
        },
        {
          provide: SmsProvider,
          useValue: {
            sendTextMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
