import { Injectable, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as usersData from './data/users.json';
import { User, UserDocument, UserRole } from './users.schema';
import { v4 as uuidV4 } from 'uuid';
import { AuthProvider } from '../common/enums/auth-provider.enum';
import { EnvironmentService } from '../environments/environment.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly envService: EnvironmentService,
  ) {}

  async onModuleInit() {
    if (this.envService.isTest()) {
      return;
    }

    const count = await this.userModel.estimatedDocumentCount();
    if (count === 0) {
      const transformedUsers = usersData.map((user) => {
        return {
          ...user,
          ___id: user.id,
          password:
            '$2b$10$LsEG1edOmHH8Sq6QacrROu/dkl7xpKNW4jlyjab9gmGWVsmLuIkjy',
          provider: AuthProvider.EMAIL,
          role: UserRole.NORMAL,
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

  async create(
    name: string,
    email: string,
    password: string,
    provider: AuthProvider,
    profileImg?: string,
    googleId?: string,
    facebookId?: string,
  ): Promise<User> {
    const user = await this.findByEmail(email);
    if (user) {
      throw new ConflictException('Email already registered');
    }

    const newUser = new this.userModel({
      name,
      email,
      password: provider === AuthProvider.EMAIL ? password : undefined,
      provider,
      profileImg,
      tosAccepted: true,
      emailVToken: provider === AuthProvider.EMAIL ? uuidV4() : undefined,
      emailVerified: provider !== AuthProvider.EMAIL,
      googleId,
      facebookId,
    });

    return await newUser.save();
  }

  async updateLastLogin(userId: string, provider: AuthProvider) {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginProvider: provider,
      lastLoginAt: new Date(),
    });
  }

  async linkGoogleId(userId: string, googleId: string) {
    await this.userModel.findByIdAndUpdate(userId, { googleId });
  }

  async linkFacebookId(userId: string, facebookId: string) {
    await this.userModel.findByIdAndUpdate(userId, { facebookId });
  }
}
