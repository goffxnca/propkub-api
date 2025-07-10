import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class Facility {
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  id: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  label: string;
}

@Schema({ _id: false })
export class Spec {
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  id: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  label: string;

  @Prop({ required: true })
  @IsNumber()
  @IsNotEmpty()
  value: number;
}

@Schema({ _id: false })
export class Location {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsNumber()
  lng: number;
}

@Schema({ _id: false })
export class Address {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  subDistrictLabel: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  subDistrictId: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  districtLabel: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  districtId: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  provinceLabel: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  provinceId: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  regionId: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Location)
  location: Location;
}

@Schema({ _id: false })
export class Views {
  @Prop({ required: true, default: 0 })
  @IsNotEmpty()
  @IsString()
  post: number;

  @Prop({ required: true, default: 0 })
  @IsNotEmpty()
  @IsString()
  phone: number;

  @Prop({ required: true, default: 0 })
  @IsNotEmpty()
  @IsString()
  line: number;
}

// Main Schema
export type PostDocument = Post & Document;

export enum PostStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  HOLD = 'hold',
  SOLD = 'sold',
  CLOSED = 'closed',
  __EMPTY = '<empty>',
  __CURRENT = '<current>',
}

export enum AssetType {
  CONDO = 'condo',
  TOWNHOME = 'townhome',
  HOUSE = 'house',
  LAND = 'land',
}

export enum PostType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum AreaUnit {
  WHOLE = 'whole',
  SQM = 'sqm',
  SQW = 'sqw',
  NGAN = 'ngan',
  RAI = 'rai',
}

export enum TimeUnit {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

export type PriceUnit = AreaUnit | TimeUnit;

export enum Condition {
  USED = 'used',
  NEW = 'new',
}

@Schema({ _id: false })
export class FirebaseTimestamp {
  @Prop({ required: true })
  seconds: number;
  @Prop({ required: true })
  nanoseconds: number;
}

@Schema({ timestamps: false }) //TODO: After seeded, we can turn back to true and remove manual createdAt, updatedAt
export class Post {
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  desc: string;

  @Prop({ required: true, enum: AssetType })
  assetType: AssetType;

  @Prop({ required: true, enum: PostType })
  postType: PostType;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, enum: PostStatus })
  status: PostStatus;

  @Prop({ required: true })
  byMember: boolean;

  @Prop({ required: true })
  thumbnail: string;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: (array: string[]) => array.length >= 3,
      message: 'Images must have at least 3 item',
    },
  })
  images: string[];

  @Prop({
    type: [Facility],
    required: true,
  })
  facilities: Facility[];

  @Prop({
    type: [Spec],
    required: true,
  })
  specs: Spec[];

  @Prop({ required: true })
  address: Address;

  @Prop({ required: true, default: {} })
  views: Views;

  // Cannot mark as required as on create mode it start with undefined and pre save hook will generate id for it, can mark as required once migrated
  @Prop()
  cid: number;

  @Prop({ required: true })
  postNumber: string;

  @Prop()
  isStudio?: boolean;

  @Prop()
  video?: string;

  // ขนาดที่ดิน
  @Prop()
  land?: number;

  // หน่วยที่ดิน
  @Prop({ enum: AreaUnit })
  landUnit?: AreaUnit;

  // ขนาดพื้นที่ใช้สอย
  @Prop()
  area?: number;

  // หน่วยพื้นที่ใช้สอย
  @Prop({ enum: AreaUnit })
  areaUnit?: AreaUnit;

  @Prop({
    enum: [...Object.values(AreaUnit), ...Object.values(TimeUnit)],
  })
  priceUnit?: PriceUnit;

  @Prop({ enum: Condition })
  condition?: Condition;

  @Prop()
  refId?: string;

  @Prop({ required: true, type: Date })
  createdAt: Date; //TODO: After seeded, we can remove this

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: string;

  @Prop({ type: Date })
  updatedAt?: Date; //TODO: After seeded, we can remove this

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updatedBy?: string;

  @Prop()
  ___id?: string; //TODO: After seeded, we can remove this

  @Prop()
  ___createdById?: string; //TODO: After seeded, we can remove this

  @Prop()
  ___createdAt?: FirebaseTimestamp; //TODO: After seeded, we can remove this

  // @Prop()
  // ___updatedAt?: FirebaseTimestamp; //TODO: After seeded, we can remove this
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Assign manual auto incremental for cid
    const lastUser = await (this.constructor as mongoose.Model<PostDocument>)
      .findOne({}, { cid: 1 }, { sort: { cid: -1 } })
      .lean();
    this.cid = (lastUser?.cid ?? 0) + 1;
  }

  next();
});
