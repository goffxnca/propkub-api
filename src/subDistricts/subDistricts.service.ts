import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubDistrict, SubDistrictDocument } from './subDistricts.schema';
import * as subDistrictsData from './data/subDistricts.json';
import { IS_TEST } from '../common/constants';

@Injectable()
export class SubDistrictsService implements OnModuleInit {
  constructor(
    @InjectModel(SubDistrict.name)
    private subDistrictModel: Model<SubDistrictDocument>,
  ) {}

  async onModuleInit() {
    if (IS_TEST) {
      return;
    }

    const count = await this.subDistrictModel.estimatedDocumentCount();
    if (count === 0) {
      await this.subDistrictModel.insertMany(subDistrictsData);
      console.log(`✅ Seeded ${subDistrictsData.length} subdistricts.`);
    }
  }

  async findAll(): Promise<SubDistrict[]> {
    return this.subDistrictModel.find().exec();
  }

  async findOne(id: string): Promise<SubDistrict | null> {
    return this.subDistrictModel.findOne({ id }).exec();
  }

  async findByDistrictId(districtId: string): Promise<SubDistrict[]> {
    return this.subDistrictModel.find({ districtId }).exec();
  }

  async seedTest(subDistrict: Partial<SubDistrict>): Promise<SubDistrict> {
    const newSubDistrict = new this.subDistrictModel(subDistrict);
    return newSubDistrict.save();
  }
}
