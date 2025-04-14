import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  AGENT = 'agent',
  ADMIN = 'admin',
  NORMAL = 'normal',
}

@Schema({ timestamps: true })
export class User {
  @Prop()
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  line?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVToken?: string;

  @Prop({ default: false })
  acceptTerm: boolean;

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
