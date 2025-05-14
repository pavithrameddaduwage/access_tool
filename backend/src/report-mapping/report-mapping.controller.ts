// src/report-mapping/report-mapping.controller.ts
import { Controller, Get, Param, Put, Body, Query } from '@nestjs/common';
import { ReportMappingService } from './report-mapping.service';
import { ReportMapping } from './entities/report-mapping.entity';

@Controller('report-mappings')
export class ReportMappingController {
  constructor(
    private readonly reportMappingService: ReportMappingService,
  ) {}

  @Get()
  async findAll(
    @Query('workspaceId') workspaceId?: string,
  ): Promise<ReportMapping[]> {
    return this.reportMappingService.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReportMapping> {
    return this.reportMappingService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('displayName') displayName: string,
  ): Promise<ReportMapping> {
    return this.reportMappingService.updateDisplayName(id, displayName);
  }
}