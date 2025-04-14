import { Controller, Get, Put, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.schema';
import { UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(): Promise<User> {
    const user = await this.usersService.getMe();
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  @Put('me')
  async updateProfile(@Body() updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersService.updateMe(updateUserDto);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }
}
