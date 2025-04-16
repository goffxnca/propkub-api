import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signinDto';
import { SignupDto } from './dto/signupDto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signin(@Body() signinDto: SigninDto) {
    const { email, password } = signinDto;
    return this.authService.signin(email, password);
  }

  @Post('register')
  signup(@Body() signupDto: SignupDto) {
    const { name, email, password } = signupDto;
    return this.authService.signup(name, email, password);
  }

  @UseGuards(AuthGuard)
  @Get('/profile')
  getProfile(@Request() req) {
    return this.authService.profile(req.userId);
  }
}
