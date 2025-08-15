import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, UserDocument } from '../users/users.schema';
import { MailService } from './mail.service';
import { EMAIL_PRE_AUTH_UPGRADE, NO_REPLY_EMAIL } from '../common/constants';

@Injectable()
export class MailCronService {
  private readonly logger = new Logger(MailCronService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendPreAuthUpgradeEmail() {
    this.logger.log(`sendPreAuthUpgradeEmail()...`);

    const user = await this.userModel
      .findOne({ ___f_pre_auth_mail_sent: false })
      .exec();

    if (!user) {
      this.logger.log(
        'No user found with ___f_pre_auth_mail_sent: false -> Exit',
      );
      return;
    }

    await this.mailService.sendEmail({
      to: user.email,
      from: NO_REPLY_EMAIL,
      templateId: EMAIL_PRE_AUTH_UPGRADE,
      templateData: {
        name: user.name,
      },
    });

    await this.userModel.findByIdAndUpdate(user._id, {
      ___f_pre_auth_mail_sent: true,
    });

    this.logger.log(
      `Send email EMAIL_PRE_AUTH_UPGRADE to user ${user.email}(cid:${user.cid}) success`,
    );
  }
}
