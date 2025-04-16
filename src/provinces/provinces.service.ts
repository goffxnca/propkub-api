import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Province, ProvinceDocument } from './provinces.schema';
import * as provincesData from './data/provinces.json';
import { IS_TEST } from '../common/constants';

@Injectable()
export class ProvincesService implements OnModuleInit {
  constructor(
    @InjectModel(Province.name) private provinceModel: Model<ProvinceDocument>,
  ) {}

  async onModuleInit() {
    if (IS_TEST) {
      return;
    }

    const count = await this.provinceModel.estimatedDocumentCount();
    if (count === 0) {
      await this.provinceModel.insertMany(provincesData);
      console.log(`✅ Seeded ${provincesData.length} provinces.`);
    }
  }

  async findAll(): Promise<Province[]> {
    return this.provinceModel.find().exec();
  }

  async findOne(id: string): Promise<Province | null> {
    return this.provinceModel.findOne({ id }).exec();
  }

  async seedTest(province: Partial<Province>): Promise<Province> {
    const newProvince = new this.provinceModel(province);
    return newProvince.save();
  }
}
