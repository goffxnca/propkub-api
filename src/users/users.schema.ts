import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../common/enums/auth-provider.enum';

export type UserDocument = User & Document;

export enum UserRole {
  // AGENT = 'agent',
  ADMIN = 'admin',
  NORMAL = 'normal',
}

@Schema({ timestamps: true })
export class User {
  _id: string;

  @Prop({ unique: true })
  cid: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  temp_p?: string; //TODO: Once migrated all users, remove this field from code and users collection

  @Prop({ required: true })
  provider: AuthProvider;

  @Prop()
  phone?: string;

  @Prop()
  line?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: false })
  tosAccepted: boolean;

  @Prop({ enum: UserRole, default: UserRole.NORMAL })
  role: UserRole;

  @Prop()
  profileImg?: string;

  @Prop()
  ___id?: string; //TODO: Firebase Id, can be remove later

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ unique: true, sparse: true })
  facebookId?: string;

  @Prop({ enum: AuthProvider })
  lastLoginProvider?: AuthProvider;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Assign manual auto incremental for cid
    const lastUser = await (this.constructor as mongoose.Model<UserDocument>)
      .findOne({}, { cid: 1 }, { sort: { cid: -1 } })
      .lean();
    this.cid = (lastUser?.cid ?? 0) + 1;
  }

  if (this.password && this.isModified('password')) {
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
