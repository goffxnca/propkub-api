import { Injectable } from '@nestjs/common';
import { User, UserDocument } from '../../users/users.schema';
import { UpdateUserDto } from '../../users/dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AdminUsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(limit?: number, offset?: number): Promise<User[]> {
    const query = this.userModel.find();

    if (offset) {
      query.skip(offset);
    }

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(createUserData: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(createUserData);
    return createdUser.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .exec();
  }

  // Delete a user
  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
