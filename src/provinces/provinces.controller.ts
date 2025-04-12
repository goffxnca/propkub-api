import { Controller, Get, Param } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { Province } from './provinces.schema';

@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Get()
  findAll(): Promise<Province[]> {
    return this.provincesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Province | null> {
    return this.provincesService.findOne(id);
  }
}