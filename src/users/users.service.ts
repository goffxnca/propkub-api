import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as usersData from './data/users.json';
import { User, UserDocument } from './users.schema';

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
          password: '123456',
          createdBy: user.id,
          updatedBy: user.id,
          tosAccepted: true,
        };
      });

      await this.userModel.insertMany(transformedUsers);
      console.log(`✅ Seeded ${transformedUsers.length} users.`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findById(userId: string) {
    return await this.userModel.findById(userId);
  }
}
