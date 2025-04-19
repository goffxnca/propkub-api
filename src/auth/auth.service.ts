import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async signup(name: string, email: string, password: string) {
    const user = await this.usersService.create(name, email, password);
    const payload = { sub: user._id };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async profile(userId: string) {
    return this.usersService.findById(userId);
  }
}
