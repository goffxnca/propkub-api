import {
  Injectable,
  OnModuleInit,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as usersData from './data/users.json';
import { User, UserDocument, UserRole } from './users.schema';
import { v4 as uuidV4 } from 'uuid';
import { AuthProvider } from '../common/enums/auth-provider.enum';
import { EnvironmentService } from '../environments/environment.service';
import { generatePassword } from '../common/utils/strings';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

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
      const transformedUsers = await Promise.all(
        (usersData as unknown as User[]).map(async (user, index) => {
          const tempIntialPassword = generatePassword();
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(tempIntialPassword, salt);
          const userId = (user as any).id;
          return {
            ...user,
            name: user?.name || user.email,
            ___id: userId,
            password: hashedPassword,
            temp_p: tempIntialPassword,
            provider: AuthProvider.EMAIL,
            role: UserRole.NORMAL,
            emailVToken:
              user.emailVerified === true ? undefined : user.emailVToken,
            createdBy: userId, //TODO: Later set to the user mongoid
            updatedBy: userId, //TODO: Later set to the user mongoid
            tosAccepted: true,
            cid: index + 1,
          };
        }),
      );

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

  async verifyEmail(vtoken: string): Promise<boolean> {
    const user = await this.userModel.findOne({
      emailVToken: vtoken,
    });

    if (!user) {
      return false;
    }

    if (user.emailVerified) {
      return false;
    }

    user.emailVerified = true;
    user.emailVToken = undefined;

    await user.save();
    return true;
  }

  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Password reset token requested for non-existent email: ${email}`,
      );
      return null;
    }

    const resetToken = uuidV4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    await this.userModel.updateOne(
      { _id: user._id },
      {
        passwordResetToken: resetToken,
        passwordResetExpires: expires,
      },
    );

    this.logger.log(`Password reset token created for user: ${user._id}`);
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      this.logger.warn(`Password reset failed: invalid or expired token`);
      return false;
    }

    user.password = newPassword;
    user.temp_p = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    this.logger.log(`Password updated successfully for user: ${user._id}`);
    return true;
  }
}
