import { Injectable, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as usersData from './data/users.json';
import { User, UserDocument } from './users.schema';
import { v4 as uuidV4 } from 'uuid';

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
          password:
            '$2b$10$LsEG1edOmHH8Sq6QacrROu/dkl7xpKNW4jlyjab9gmGWVsmLuIkjy',
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

  async create(name: string, email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (user) {
      throw new ConflictException('Email already registered');
    }

    const newUser = new this.userModel({
      name,
      email,
      password,
      tosAccepted: true,
      emailVToken: uuidV4(),
    });

    //TODO: Send verification email
    // const verificationUrl = `${SITE_DOMAIN}/auth/verify-email?vtoken=${emailVerficationToken}&email=${encodeURIComponent(
    //   email,
    // )}`;
    // await sendEmail({
    //   from: NO_REPLY_EMAIL,
    //   to: email,
    //   templateId: EMAIL_WELCOME,
    //   templateData: {
    //     verificationUrl,
    //   },
    // });

    return await newUser.save();
  }
}
