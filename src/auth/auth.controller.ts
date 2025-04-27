import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signupDto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  signup(@Body() signupDto: SignupDto) {
    const { name, email, password } = signupDto;
    return this.authService.signup(name, email, password);
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
}
