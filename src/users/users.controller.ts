import { Controller, Get, Put, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.schema';
import { UpdateProfileDto } from './dto/user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

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

  @Put(':id')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Profile update data',
    examples: {
      user: {
        value: {
          name: 'John Doe Updated',
        },
      },
    },
  })
  @Put('me')
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.usersService.updateMe(updateProfileDto);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }
}
