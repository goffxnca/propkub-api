import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Embedded Types
export class Facility {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;
}

export class Spec {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  value: number;
}

export class Location {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}

export class Address {
  @Prop({ required: true })
  subDistrictLabel: string;

  @Prop({ required: true })
  subDistrictId: string;

  @Prop({ required: true })
  districtLabel: string;

  @Prop({ required: true })
  districtId: string;

  @Prop({ required: true })
  provinceLabel: string;

  @Prop({ required: true })
  provinceId: string;

  @Prop({ required: true })
  regionId: string;

  @Prop({ required: true })
  location: Location;
}

export class CreatedBy {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  profileImg?: string;

  @Prop()
  line?: string;
}

export class AcceptInfo {
  @Prop({ required: true })
  accept: boolean;

  @Prop({ required: true })
  tosAccepted: string;
}

export class UInfo {
  @Prop({ required: true })
  ua: string;
}

export class Legal {
  @Prop({ type: AcceptInfo, required: true })
  acceptInfo: AcceptInfo;

  @Prop({ type: UInfo })
  uInfo?: UInfo;
}

export class Timestamp {
  @Prop({ required: true })
  seconds: number;

  @Prop({ required: true })
  nanoseconds: number;
}

export class Contact {
  @Prop()
  name?: string;

  @Prop()
  phone?: string;

  @Prop()
  line?: string;

  @Prop()
  profileImg?: string;
}

export class Stats {
  @Prop()
  views?: number;

  @Prop()
  saves?: number;

  @Prop()
  shares?: number;
}

// Main Schema
export type PostDocument = Post & Document;

export enum PostStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PostSubStatus {
  CREATED = 'created',
  FULFILLED = 'fulfilled',
  EXPIRED = 'expired',
  CLOSED = 'closed',
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

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

@Schema({ timestamps: false })
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

  @Prop({ enum: [...Object.values(AreaUnit), ...Object.values(TimeUnit)] })
  priceUnit: PriceUnit;

  @Prop({ required: true })
  area: number;

  @Prop({ enum: AreaUnit })
  areaUnit: AreaUnit;

  @Prop({ required: true, enum: PostStatus })
  status: PostStatus;

  @Prop({ enum: PostSubStatus })
  subStatus: PostSubStatus;

  @Prop({ required: true, default: false })
  isMember: boolean;

  @Prop({ required: true, default: false })
  isStudio: boolean;

  @Prop({ required: true })
  thumbnail: string;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop()
  video?: string;

  @Prop({ type: [Facility], required: true })
  facilities: Facility[];

  @Prop({ type: [Spec], required: true })
  specs: Spec[];

  @Prop({ required: true })
  address: Address;

  @Prop()
  legal?: Legal;

  @Prop({ required: true, default: 0 })
  postViews: number;

  @Prop({ required: true, default: 0 })
  phoneViews: number;

  @Prop({ required: true, default: 0 })
  lineViews: number;

  @Prop({ required: true })
  cid: number;

  @Prop()
  refId?: string;

  @Prop()
  postNumber: string;

  @Prop()
  land?: number;

  @Prop({ enum: AreaUnit })
  landUnit: AreaUnit;

  @Prop({ enum: Condition })
  condition: Condition;

  @Prop()
  contact: Contact;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ required: true })
  createdBy: CreatedBy;

  @Prop()
  updatedBy: CreatedBy;

  @Prop()
  ___id?: string;

  @Prop({ type: Object })
  ___createdAt?: FirebaseTimestamp;

  @Prop({ type: Object })
  ___updatedAt?: FirebaseTimestamp;
}

export const PostSchema = SchemaFactory.createForClass(Post);
