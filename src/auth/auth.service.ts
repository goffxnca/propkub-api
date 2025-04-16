import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || password !== user.password) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user._id };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async profile(userId: string) {
    return this.usersService.findById(userId);
  }
}
