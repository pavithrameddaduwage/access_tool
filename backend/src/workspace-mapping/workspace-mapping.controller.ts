// src/workspace-mapping/workspace-mapping.controller.ts
import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { WorkspaceMappingService } from './workspace-mapping.service';
import { WorkspaceMapping } from './entities/workspace-mapping.entity';

@Controller('workspace-mappings')
export class WorkspaceMappingController {
  constructor(
    private readonly workspaceMappingService: WorkspaceMappingService,
  ) {}

  @Get()
  async findAll(): Promise<WorkspaceMapping[]> {
    return this.workspaceMappingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WorkspaceMapping> {
    return this.workspaceMappingService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('displayName') displayName: string,
  ): Promise<WorkspaceMapping> {
    return this.workspaceMappingService.updateDisplayName(id, displayName);
  }
}