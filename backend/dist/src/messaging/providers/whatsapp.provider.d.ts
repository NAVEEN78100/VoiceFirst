import { ConfigService } from '@nestjs/config';
export interface ProviderSendResult {
    success: boolean;
    providerMessageId?: string;
    response?: unknown;
    errorMessage?: string;
}
export declare class WhatsAppProvider {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendTextMessage(to: string, body: string): Promise<ProviderSendResult>;
}
