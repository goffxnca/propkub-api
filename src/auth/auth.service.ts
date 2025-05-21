import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../common/enums/auth-provider.enum';
import {
  EMAIL_PASSWORD_RESET,
  EMAIL_WELCOME,
  EMAIL_WELCOME_WITH_VERIFICATION,
  NO_REPLY_EMAIL,
} from '../common/constants';
import { MailService } from '../mail/mail.service';
import { EnvironmentService } from '../environments/environment.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvironmentService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async signup(name: string, email: string, password: string) {
    const user = await this.usersService.create(
      name,
      email,
      password,
      AuthProvider.EMAIL,
    );

    if (!user.emailVerified) {
      const verificationUrl = `${this.envService.siteDomain()}/auth/verify-email?vtoken=${user.emailVToken}`;
      await this.mailService.sendEmail({
        from: NO_REPLY_EMAIL,
        to: user.email,
        templateId: EMAIL_WELCOME_WITH_VERIFICATION,
        templateData: {
          verificationUrl,
        },
      });
    }

    const payload = { sub: user._id };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async verifyEmail(vtoken: string): Promise<boolean> {
    return this.usersService.verifyEmail(vtoken);
  }

  async login(user: any) {
    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    await this.usersService.updateLastLogin(user.id, AuthProvider.EMAIL);
    return { accessToken };
  }

  async loginGoogle(user: any) {
    const { email, name, googleId, profileImg } = user;
    const existingUser = await this.usersService.findByEmail(email);
    let finalUser = existingUser;

    if (existingUser) {
      if (!existingUser.googleId) {
        await this.usersService.linkGoogleId(existingUser._id, googleId);
      }
    } else {
      finalUser = await this.usersService.create(
        name,
        email,
        '',
        AuthProvider.GOOGLE,
        profileImg,
        googleId,
      );

      await this.mailService.sendEmail({
        from: NO_REPLY_EMAIL,
        to: user.email,
        templateId: EMAIL_WELCOME,
        templateData: {},
      });
    }
    const userId = finalUser?._id!;

    const payload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload);
    await this.usersService.updateLastLogin(userId, AuthProvider.GOOGLE);
    return { accessToken };
  }

  async loginFacebook(user: any) {
    const { email, name, facebookId, profileImg } = user;
    const existingUser = await this.usersService.findByEmail(email);
    let finalUser = existingUser;

    if (existingUser) {
      if (!existingUser.facebookId) {
        await this.usersService.linkFacebookId(existingUser._id, facebookId);
      }
    } else {
      finalUser = await this.usersService.create(
        name,
        email,
        '',
        AuthProvider.FACEBOOK,
        profileImg,
        undefined,
        facebookId,
      );

      await this.mailService.sendEmail({
        from: NO_REPLY_EMAIL,
        to: user.email,
        templateId: EMAIL_WELCOME,
        templateData: {},
      });
    }

    const userId = finalUser?._id!;
    const payload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload);
    await this.usersService.updateLastLogin(userId, AuthProvider.FACEBOOK);
    return { accessToken };
  }

  async profile(userId: string) {
    return this.usersService.findById(userId);
  }

  async sendPasswordResetEmail(email: string) {
    this.logger.log(`Password reset requested for email: ${email}`);
    const resetToken = await this.usersService.createPasswordResetToken(email);

    if (!resetToken) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const resetUrl = `${this.envService.siteDomain()}/auth/reset-password?token=${resetToken}`;
    this.logger.log(`Password reset token generated for email: ${email}`);

    await this.mailService.sendEmail({
      from: NO_REPLY_EMAIL,
      to: email,
      templateId: EMAIL_PASSWORD_RESET,
      templateData: {
        resetUrl,
      },
    });

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    this.logger.log(
      `Password reset attempt with token: ${token.substring(0, 8)}...`,
    );
    const success = await this.usersService.resetPassword(token, newPassword);

    if (!success) {
      this.logger.warn(
        `Password reset failed: Invalid or expired token ${token.substring(0, 8)}...`,
      );
      throw new BadRequestException('Invalid or expired reset token');
    }

    this.logger.log(
      `Password reset successful for token: ${token.substring(0, 8)}...`,
    );
    return { message: 'Password has been reset successfully' };
  }
}
