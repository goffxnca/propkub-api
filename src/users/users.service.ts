import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';
import * as usersData from './data/users.json';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    const count = await this.userModel.estimatedDocumentCount();
    if (count === 0) {
      const transformedUsers = usersData.map((user) => {
        return {
          ...user,
          ___id: user.id,
          createdBy: user.id,
          updatedBy: user.id,
          tosAccepted: true,
        };
      });

      await this.userModel.insertMany(transformedUsers);
      console.log(`✅ Seeded ${transformedUsers.length} users.`);
    }
  }

  async getMe(): Promise<User | null> {
    const firstUser = await this.userModel.findOne().exec();
    return firstUser;
  }

  async updateMe(profileDto: UpdateProfileDto): Promise<User | null> {
    const firstUser = await this.userModel.findOne().exec();
    if (!firstUser) return null;

    const allowedUpdates = {
      name: profileDto.name,
    };

    return this.userModel
      .findByIdAndUpdate(firstUser.id, { $set: allowedUpdates }, { new: true })
      .exec();
  }
}
