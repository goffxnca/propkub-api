import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
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
import { truncEmail, truncToken } from '../common/utils/strings';
import { UserRole } from '../users/users.schema';

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
    this.logger.debug(`Validating credentials for user: ${truncEmail(email)}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.debug(
        `Authentication failed: user not found - ${truncEmail(email)}`,
      );
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (passwordValid) {
      this.logger.debug(
        `Authentication successful for user: ${truncEmail(email)}`,
      );
      return user;
    } else {
      this.logger.debug(
        `Authentication failed: invalid password for user - ${truncEmail(email)}`,
      );
      return null;
    }
  }

  async signup(
    name: string,
    email: string,
    password: string,
    isAgent: boolean,
  ) {
    this.logger.log(`Creating new user account: ${truncEmail(email)}`);

    try {
      const user = await this.usersService.create(
        name,
        email,
        password,
        isAgent ? UserRole.AGENT : UserRole.NORMAL,
        AuthProvider.EMAIL,
      );

      this.logger.log(
        `User account created successfully: ${truncEmail(email)} (ID: ${user._id})`,
      );

      if (!user.emailVerified) {
        this.logger.debug(
          `Sending verification email to: ${truncEmail(email)}`,
        );
        const verificationUrl = `${this.envService.webDomain()}/auth/verify-email?vtoken=${user.emailVToken}`;
        this.mailService.sendEmail({
          from: NO_REPLY_EMAIL,
          to: user.email,
          templateId: EMAIL_WELCOME_WITH_VERIFICATION,
          templateData: {
            verificationUrl,
          },
        });
        this.logger.debug(`Verification email sent to: ${truncEmail(email)}`);
      }

      await this.usersService.updateLastLogin(user._id, AuthProvider.EMAIL);

      const payload = { sub: user._id };
      const accessToken = await this.jwtService.signAsync(payload);
      return { accessToken };
    } catch (error) {
      this.logger.warn(
        `Failed to create user account: ${truncEmail(email)}`,
        error.stack,
      );
      throw error;
    }
  }

  async verifyEmail(vtoken: string): Promise<boolean> {
    this.logger.debug(`Verifying email with token: ${truncToken(vtoken)}`);
    const result = await this.usersService.verifyEmail(vtoken);

    if (result) {
      this.logger.debug(
        `Email verification successful for token: ${truncToken(vtoken)}`,
      );
    } else {
      this.logger.debug(
        `Email verification failed for token: ${truncToken(vtoken)}`,
      );
    }

    return result;
  }

  async login(user: any) {
    this.logger.debug(
      `Generating auth token for user: ${truncEmail(user.email)} (ID: ${user.id})`,
    );

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.debug(
      `Updating last login for user: ${truncEmail(user.email)}`,
    );
    await this.usersService.updateLastLogin(user.id, AuthProvider.EMAIL);

    return { accessToken };
  }

  async loginGoogle(user: any) {
    const { email, name, googleId, profileImg } = user;
    this.logger.log(`Processing Google OAuth login for: ${truncEmail(email)}`);

    const existingUser = await this.usersService.findByEmail(email);
    let finalUser = existingUser;

    if (existingUser) {
      this.logger.debug(
        `Existing user found for Google OAuth: ${truncEmail(email)}`,
      );

      if (!existingUser.googleId) {
        this.logger.debug(
          `Linking Google account to existing user: ${truncEmail(email)}`,
        );
        await this.usersService.linkGoogleId(existingUser._id, googleId);
      }
    } else {
      this.logger.debug(
        `Creating new user from Google OAuth: ${truncEmail(email)}`,
      );

      finalUser = await this.usersService.create(
        name,
        email,
        '',
        UserRole.NORMAL,
        AuthProvider.GOOGLE,
        profileImg,
        googleId,
      );

      this.logger.debug(`Sending welcome email to: ${truncEmail(email)}`);
      this.mailService.sendEmail({
        from: NO_REPLY_EMAIL,
        to: user.email,
        templateId: EMAIL_WELCOME,
        templateData: {},
      });
    }

    const userId = finalUser?._id!;
    const payload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.debug(`Updating last login for user: ${truncEmail(email)}`);
    await this.usersService.updateLastLogin(userId, AuthProvider.GOOGLE);

    this.logger.log(`Google OAuth login successful for: ${truncEmail(email)}`);
    return { accessToken };
  }

  async loginFacebook(user: any) {
    const { email, name, facebookId, profileImg } = user;
    this.logger.log(
      `Processing Facebook OAuth login for: ${truncEmail(email)}`,
    );

    const existingUser = await this.usersService.findByEmail(email);
    let finalUser = existingUser;

    if (existingUser) {
      this.logger.debug(
        `Existing user found for Facebook OAuth: ${truncEmail(email)}`,
      );

      if (!existingUser.facebookId) {
        this.logger.debug(
          `Linking Facebook account to existing user: ${truncEmail(email)}`,
        );
        await this.usersService.linkFacebookId(existingUser._id, facebookId);
      }
    } else {
      this.logger.debug(
        `Creating new user from Facebook OAuth: ${truncEmail(email)}`,
      );

      finalUser = await this.usersService.create(
        name,
        email,
        '',
        UserRole.NORMAL,
        AuthProvider.FACEBOOK,
        profileImg,
        undefined,
        facebookId,
      );

      this.logger.debug(`Sending welcome email to: ${truncEmail(email)}`);
      this.mailService.sendEmail({
        from: NO_REPLY_EMAIL,
        to: user.email,
        templateId: EMAIL_WELCOME,
        templateData: {},
      });
    }

    const userId = finalUser?._id!;
    const payload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.debug(`Updating last login for user: ${truncEmail(email)}`);
    await this.usersService.updateLastLogin(userId, AuthProvider.FACEBOOK);

    this.logger.log(
      `Facebook OAuth login successful for: ${truncEmail(email)}`,
    );
    return { accessToken };
  }

  async profile(userId: string) {
    this.logger.debug(`Retrieving profile for user ID: ${userId}`);
    return this.usersService.findById(userId);
  }

  async sendPasswordResetEmail(email: string) {
    this.logger.log(`Password reset requested for email: ${truncEmail(email)}`);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    if (user.provider !== AuthProvider.EMAIL) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const resetToken = await this.usersService.createPasswordResetToken(email);

    if (!resetToken) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const resetUrl = `${this.envService.webDomain()}/auth/reset-password?token=${resetToken}`;
    this.logger.log(
      `Password reset token generated for email: ${truncEmail(email)}`,
    );

    this.mailService.sendEmail({
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
    this.logger.log(`Password reset attempt with token: ${truncToken(token)}`);
    const success = await this.usersService.resetPassword(token, newPassword);

    if (!success) {
      this.logger.warn(
        `Password reset failed: Invalid or expired token ${truncToken(token)}`,
      );
      throw new BadRequestException('Invalid or expired reset token');
    }

    this.logger.log(
      `Password reset successful for token: ${truncToken(token)}`,
    );
    return { message: 'Password has been reset successfully' };
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    this.logger.log(`Password update attempt for user: ${userId}`);

    try {
      const success = await this.usersService.updatePassword(
        userId,
        currentPassword,
        newPassword,
      );

      if (success) {
        this.logger.log(`Password updated successfully for user: ${userId}`);
        return { message: 'Password has been updated successfully' };
      } else {
        this.logger.warn(`Password update failed for user: ${userId}`);
        throw new BadRequestException('Failed to update password');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to update password');
    }
  }
}
