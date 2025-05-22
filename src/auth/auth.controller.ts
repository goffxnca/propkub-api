import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signupDto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { VerifyEmailDto } from './dto/verifyEmailDto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  signup(@Body() signupDto: SignupDto) {
    const { name, email, password } = signupDto;
    return this.authService.signup(name, email, password);
  }

  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailDto) {
    const { vtoken } = query;
    const success = await this.authService.verifyEmail(vtoken);

    if (!success) {
      throw new BadRequestException('Invalid or expired verification token.');
    }
    return { message: 'Email verified successfully' };
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  loginGoogle() {
    // initiates the Google OAuth2 login flow
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/redirect')
  googleAuthRedirect(@Request() req) {
    return this.authService.loginGoogle(req.user);
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  loginFacebook() {
    // initiates the Facebook OAuth2 login flow
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook/redirect')
  facebookAuthRedirect(@Request() req) {
    return this.authService.loginFacebook(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  getProfile(@Request() req) {
    return this.authService.profile(req.user.userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Forgot password request received for: ${forgotPasswordDto.email}`);
    return this.authService.sendPasswordResetEmail(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log(`Reset password request received with token: ${resetPasswordDto.token.substring(0, 8)}...`);
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  updatePassword(@Request() req, @Body() updatePasswordDto: UpdatePasswordDto) {
    this.logger.log(`Update password request received for user: ${req.user.userId}`);
    return this.authService.updatePassword(
      req.user.userId,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword,
    );
  }
}
