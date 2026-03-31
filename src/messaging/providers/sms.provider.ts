import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type { ProviderSendResult } from './whatsapp.provider';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendTextMessage(to: string, body: string): Promise<ProviderSendResult> {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (!sid || !authToken || !from) {
      const mockId = `mock-sms-${randomUUID()}`;
      this.logger.warn(`Twilio credentials missing. Using mock SMS send for ${to} (id=${mockId}).`);
      this.logger.log(`[SMS-MOCK] ${to}: ${body}`);
      return {
        success: true,
        providerMessageId: mockId,
        response: { mocked: true },
      };
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', from);
    params.append('Body', body);

    try {
      const { data } = await axios.post(endpoint, params.toString(), {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: sid,
          password: authToken,
        },
      });

      this.logger.log(`SMS provider accepted message for ${to} with id=${data?.sid ?? 'n/a'}`);

      return {
        success: true,
        providerMessageId: data?.sid,
        response: data,
      };
    } catch (err: any) {
      const providerData = err?.response?.data;
      const providerError = providerData?.message || err?.message || 'Unknown SMS provider error';

      this.logger.error(`SMS send failed for ${to}: ${providerError}`);

      return {
        success: false,
        response: providerData,
        errorMessage: providerError,
      };
    }
  }
}
