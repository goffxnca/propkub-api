import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  NotFoundException,
  Query,
  Body,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { User } from '../../users/users.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto } from '../../users/dto/user.dto';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id.pipe';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto): Promise<User[]> {
    return this.adminUsersService.findAll(pagination.limit, pagination.offset);
  }

  @Get(':id')
  async findOne(@Param('id', MongoIdValidationPipe) id: string): Promise<User> {
    const user = await this.adminUsersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    const userData = {
      ...createUserDto,
      createdBy: 'admin',
    };
    return this.adminUsersService.create(userData);
  }

  @Put(':id')
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.adminUsersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  async remove(@Param('id', MongoIdValidationPipe) id: string): Promise<User> {
    const user = await this.adminUsersService.remove(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
