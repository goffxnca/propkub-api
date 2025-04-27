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

  siteDomain(): string {
    return (
      this.configService.get<string>('SITE_DOMAIN') ?? 'http://localhost:3000'
    );
  }
}
