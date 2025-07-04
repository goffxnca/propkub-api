import {
  Body,
  Controller,
  Post,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Query,
  BadRequestException,
  Logger,
  Response,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signupDto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleAuthWithStateGuard } from './guards/google-auth-with-state.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { VerifyEmailDto } from './dto/verifyEmailDto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { truncEmail, truncToken } from '../common/utils/strings';
import { OAuthStateData } from './interfaces/oauth-state.interface';
import { EnvironmentService } from '../environments/environment.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly envService: EnvironmentService,
  ) {}

  @Post('register')
  signup(@Body() signupDto: SignupDto) {
    const { name, email, password, isAgent } = signupDto;
    this.logger.log(`Registration request for email: ${truncEmail(email)}`);
    return this.authService.signup(name, email, password, isAgent);
  }

  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailDto) {
    const { vtoken } = query;
    this.logger.log(
      `Email verification request with token: ${truncToken(vtoken)}`,
    );

    const success = await this.authService.verifyEmail(vtoken);

    if (!success) {
      this.logger.warn(
        `Email verification failed for token: ${truncToken(vtoken)}`,
      );
      throw new BadRequestException('Invalid or expired verification token.');
    }

    this.logger.log(
      `Email verified successfully for token: ${truncToken(vtoken)}`,
    );
    return { message: 'Email verified successfully' };
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Request() req) {
    this.logger.log(`Login successful for user: ${truncEmail(req.user.email)}`);
    return this.authService.login(req.user);
  }

  @UseGuards(GoogleAuthWithStateGuard)
  @Get('google')
  loginGoogle() {
    // initiates the Google OAuth2 login flow
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/redirect')
  async googleAuthRedirect(@Request() req, @Response() res, @Query() query) {
    this.logger.log(
      `[googleAuthRedirect()] Google OAuth callback for user: ${truncEmail(req.user.email)}`,
    );

    try {
      const { state } = query;
      if (state) {
        return this.handleGoogleWithCustomState(req, res, state);
      }

      // Regular login/signup flow
      const result = await this.authService.loginGoogle(req.user);
      const { accessToken } = result;

      res.redirect(
        `${this.envService.webDomain()}/auth/callback?token=${accessToken}`,
      );
    } catch (error) {
      this.logger.error(
        `[googleAuthRedirect()] Google OAuth callback error:`,
        error,
      );
      res.redirect(
        `${this.envService.webDomain()}/auth/callback?error=oauth_failed`,
      );
    }
  }

  private async handleGoogleWithCustomState(
    @Request() req,
    @Response() res,
    state: string,
  ) {
    this.logger.log(
      `[handleGoogleWithCustomState()] Google OAuth callback with custom state for user: ${truncEmail(req.user.email)}`,
    );

    let stateData: OAuthStateData;
    try {
      stateData = JSON.parse(state);
    } catch (error) {
      this.logger.warn(
        '[handleGoogleWithCustomState()] Google OAuth failed: Invalid state format',
      );
      return res.redirect(
        `${this.envService.webDomain()}/auth/callback?error=oauth_failed`,
      );
    }

    // Dispatch based on mode
    switch (stateData.mode) {
      case 'link':
        return this.handleGoogleLinking(req, res, stateData);
      default:
        this.logger.warn(
          `[handleGoogleWithCustomState()] Google OAuth failed: Unknown mode '${stateData.mode}'`,
        );
        return res.redirect(
          `${this.envService.webDomain()}/auth/callback?error=oauth_failed`,
        );
    }
  }

  private async handleGoogleLinking(
    @Request() req,
    @Response() res,
    stateData: OAuthStateData,
  ) {
    this.logger.log(
      `[handleGoogleLinking()] Google account linking for user: ${truncEmail(req.user.email)}`,
    );

    const { email: currentEmail } = stateData;

    try {
      if (!currentEmail) {
        this.logger.warn(
          '[handleGoogleLinking()] Google linking failed: Missing current email parameter',
        );
        return res.redirect(
          `${this.envService.webDomain()}/auth/callback?error=missing_email`,
        );
      }

      if (req.user.email !== currentEmail) {
        this.logger.warn(
          `[handleGoogleLinking()] Google linking failed: Email mismatch. OAuth: ${truncEmail(req.user.email)}, Expected: ${truncEmail(currentEmail)}`,
        );
        return res.redirect(
          `${this.envService.webDomain()}/auth/callback?error=email_mismatch&expectedEmail=${encodeURIComponent(currentEmail)}&provider=google`,
        );
      }

      const result = await this.authService.linkGoogleAccount(req.user);
      const { accessToken } = result;

      return res.redirect(
        `${this.envService.webDomain()}/auth/callback?token=${accessToken}&success=link_success&provider=google`,
      );
    } catch (error) {
      this.logger.error(
        `[handleGoogleLinking()] Google account linking callback error:`,
        error,
      );

      if (error.message?.includes('already linked')) {
        return res.redirect(
          `${this.envService.webDomain()}/auth/callback?error=already_linked&provider=google`,
        );
      }

      res.redirect(
        `${this.envService.webDomain()}/auth/callback?error=linking_failed`,
      );
    }
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  loginFacebook() {
    // initiates the Facebook OAuth2 login flow
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook/redirect')
  async facebookAuthRedirect(@Request() req, @Response() res) {
    this.logger.log(
      `Facebook OAuth callback for user: ${truncEmail(req.user.email)}`,
    );

    try {
      const result = await this.authService.loginFacebook(req.user);
      const { accessToken } = result;

      res.redirect(
        `${this.envService.webDomain()}/auth/callback?token=${accessToken}`,
      );
    } catch (error) {
      this.logger.error(`Facebook OAuth callback error:`, error);
      res.redirect(
        `${this.envService.webDomain()}/auth/callback?error=oauth_failed`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  getProfile(@Request() req): Promise<ProfileResponseDto> {
    this.logger.log(`Profile request for user ID: ${req.user.userId}`);
    return this.authService.profile(req.user.userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(
      `Forgot password request for email: ${truncEmail(forgotPasswordDto.email)}`,
    );
    return this.authService.sendPasswordResetEmail(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log(
      `Reset password request with token: ${truncToken(resetPasswordDto.token)}`,
    );
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Get('validate-reset-token')
  validateResetToken(@Query() validateResetTokenDto: ValidateResetTokenDto) {
    this.logger.log(
      `Reset token validation request: ${truncToken(validateResetTokenDto.token)}`,
    );
    return this.authService.validateResetToken(validateResetTokenDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  updatePassword(@Request() req, @Body() updatePasswordDto: UpdatePasswordDto) {
    this.logger.log(`Update password request for user ID: ${req.user.userId}`);
    return this.authService.updatePassword(
      req.user.userId,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    this.logger.log(`Update profile request for user ID: ${req.user.userId}`);
    return this.authService.updateProfile(req.user.userId, updateProfileDto);
  }
}
