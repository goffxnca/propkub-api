import { Injectable, ConflictException } from '@nestjs/common';
import { User, UserDocument } from '../../users/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuthProvider } from '../../common/enums/auth-provider.enum';
import { MailService } from '../../mail/mail.service';
import {
  EMAIL_SET_NEW_PASSWORD_UPGRADE_AUTH_PRE,
  NO_REPLY_EMAIL,
} from '../../common/constants';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  async findAll(limit?: number, offset?: number): Promise<User[]> {
    console.log('SENDGRID_API_KEY', process.env.SENDGRID_API_KEY);
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

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.email) {
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException(
          `User with email ${createUserDto.email} already exists`,
        );
      }
    }

    const userData = {
      ...createUserDto,
      provider: AuthProvider.EMAIL,
      createdBy: 'admin',
      createdAt: new Date(),
    };

    const createdUser = new this.userModel(userData);
    return createdUser.save(); //TODO: Exclude password
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { $set: updateUserDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async seedTest(userData: Partial<User>): Promise<User> {
    const newUser = new this.userModel({ ...userData, createdAt: new Date() });
    return newUser.save();
  }

  async sendEamilSetNewPasswordPre(cidFrom: number, cidTo: number) {
    const users = await this.userModel
      // .find({ cid: { $gte: cidFrom, $lte: cidTo } })
      .find({ cid: { $gte: 44, $lte: 50 } }) // 44-50 NOT SENDING YET HIT LIMIT
      .lean();

    for (const user of users) {
      console.log('user' + user.name);
      await this.mailService.sendEmail({
        to: user.email,
        from: NO_REPLY_EMAIL,
        templateId: EMAIL_SET_NEW_PASSWORD_UPGRADE_AUTH_PRE,
        templateData: {
          name: user.name,
        },
      });
    }
  }
}
