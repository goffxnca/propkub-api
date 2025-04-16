import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

export enum UserRole {
  AGENT = 'agent',
  ADMIN = 'admin',
  NORMAL = 'normal',
}

@Schema({ timestamps: true })
export class User {
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone?: string;

  @Prop()
  line?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVToken?: string;

  @Prop({ default: false })
  tosAccepted: boolean;

  @Prop({ enum: UserRole, default: UserRole.NORMAL })
  role: UserRole;

  @Prop()
  profileImg?: string;

  @Prop()
  ___id?: string;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (!this.createdBy) {
    this.createdBy = this._id;
  }
  if (!this.updatedBy) {
    this.updatedBy = this._id;
  }

  next();
});
