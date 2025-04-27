import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EnvironmentModule } from '../environments/environment.module';

@Module({
  imports: [EnvironmentModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
