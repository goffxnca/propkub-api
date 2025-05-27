import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  Address,
  AreaUnit,
  AssetType,
  Condition,
  Facility,
  PostType,
  PriceUnit,
  Spec,
  TimeUnit,
} from '../posts.schema';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  desc: string;

  @IsNotEmpty()
  @IsEnum(AssetType)
  assetType: string;

  @IsNotEmpty()
  @IsEnum(PostType)
  postType: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsEnum({ ...AreaUnit, ...TimeUnit })
  priceUnit: PriceUnit;

  @IsNotEmpty()
  @IsNumber()
  area: number;

  @IsNotEmpty()
  @IsEnum(AreaUnit)
  areaUnit: string;

  @IsNotEmpty()
  @IsBoolean()
  isDraft: boolean;

  @IsNotEmpty()
  @IsString()
  thumbnail: string;

  @IsNotEmpty()
  @IsBoolean()
  isStudio: boolean;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(3)
  images: string[];

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => Facility)
  facilities: Facility[];

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => Spec)
  specs: Spec[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Address)
  address: Address;

  @IsNotEmpty()
  @IsEnum(Condition)
  condition: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsNumber()
  land?: number;

  @IsOptional()
  @IsEnum(AreaUnit)
  landUnit?: string;

  @IsOptional()
  @IsString()
  refId?: string;
}
