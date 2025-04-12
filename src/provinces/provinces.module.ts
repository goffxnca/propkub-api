import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvincesService } from './provinces.service';
import { ProvincesController } from './provinces.controller';
import { Province, ProvinceSchema } from './provinces.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Province.name, schema: ProvinceSchema }])],
  providers: [ProvincesService],
  controllers: [ProvincesController],
})
export class ProvincesModule {}