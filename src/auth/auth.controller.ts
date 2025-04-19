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
import { SignupDto } from './dto/signupDto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signin(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  signup(@Body() signupDto: SignupDto) {
    const { name, email, password } = signupDto;
    return this.authService.signup(name, email, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  getProfile(@Request() req) {
    return this.authService.profile(req.user.userId);
  }
}
