import { ConfigService } from '@nestjs/config';
import type { ProviderSendResult } from './whatsapp.provider';
export declare class SmsProvider {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendTextMessage(to: string, body: string): Promise<ProviderSendResult>;
}
