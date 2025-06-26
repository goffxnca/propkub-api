import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  isDev(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'dev';
  }

  isTest(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'test';
  }

  isProd(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'prod';
  }

  apiDomain(): string {
    const apiDomain = this.configService.get<string>('API_DOMAIN');
    if (!apiDomain) {
      throw new Error('API_DOMAIN env is missing.');
    }
    return apiDomain;
  }

  webDomain(): string {
    const webDomain = this.configService.get<string>('WEB_DOMAIN');
    if (!webDomain) {
      throw new Error('WEB_DOMAIN env is missing.');
    }
    return webDomain;
  }

  sendGridApiKey(): string {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY env is missing.');
    }
    return apiKey;
  }
}
