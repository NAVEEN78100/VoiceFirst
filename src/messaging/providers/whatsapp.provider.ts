import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  response?: unknown;
  errorMessage?: string;
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendTextMessage(to: string, body: string): Promise<ProviderSendResult> {
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v21.0');

    if (!accessToken || !phoneNumberId) {
      return {
        success: false,
        errorMessage: 'Missing WhatsApp credentials: WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID',
      };
    }

    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    try {
      const { data } = await axios.post(
        endpoint,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            preview_url: true,
            body,
          },
        },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const providerMessageId = data?.messages?.[0]?.id;

      this.logger.log(`WhatsApp API accepted message for ${to} with id=${providerMessageId ?? 'n/a'}`);

      return {
        success: true,
        providerMessageId,
        response: data,
      };
    } catch (err: any) {
      const providerData = err?.response?.data;
      const providerError = providerData?.error?.message || err?.message || 'Unknown WhatsApp API error';

      this.logger.error(`WhatsApp API send failed for ${to}: ${providerError}`);

      return {
        success: false,
        response: providerData,
        errorMessage: providerError,
      };
    }
  }
}
