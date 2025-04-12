import { Controller, Get, Param } from '@nestjs/common';
import { SubDistrictsService } from './subDistricts.service';
import { SubDistrict } from './subDistricts.schema';

@Controller('subdistricts')
export class SubDistrictsController {
  constructor(private readonly subDistrictsService: SubDistrictsService) {}

  @Get()
  findAll(): Promise<SubDistrict[]> {
    return this.subDistrictsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SubDistrict | null> {
    return this.subDistrictsService.findOne(id);
  }

  @Get('district/:districtId')
  findByDistrictId(@Param('districtId') districtId: string): Promise<SubDistrict[]> {
    return this.subDistrictsService.findByDistrictId(districtId);
  }
} 