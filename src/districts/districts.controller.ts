import { Controller, Get, Param } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { District } from './districts.schema';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  findAll(): Promise<District[]> {
    return this.districtsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<District | null> {
    return this.districtsService.findOne(id);
  }

  @Get('province/:provinceId')
  findByProvinceId(@Param('provinceId') provinceId: string): Promise<District[]> {
    return this.districtsService.findByProvinceId(provinceId);
  }
} 