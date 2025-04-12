import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';
import { District, DistrictSchema } from './districts.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: District.name, schema: DistrictSchema }])],
  providers: [DistrictsService],
  controllers: [DistrictsController],
})
export class DistrictsModule {} 