import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentKam } from '../auth/current-kam.decorator';
import { KamPayload } from '../auth/types';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './companies.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMe(@CurrentKam() kam: KamPayload) {
    return { id: kam.id, email: kam.email, name: kam.name };
  }

  @Get('companies')
  findAll(
    @CurrentKam() kam: KamPayload,
    @Query('sort') sort?: string,
    @Query('filter') filter?: string,
  ) {
    return this.companiesService.findAllForKam(kam.id, sort, filter);
  }

  @Get('companies/:id')
  findOne(@CurrentKam() kam: KamPayload, @Param('id') id: string) {
    return this.companiesService.findOneForKam(kam.id, id);
  }

  @Patch('companies/:id')
  update(
    @CurrentKam() kam: KamPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(kam.id, id, dto);
  }
}
