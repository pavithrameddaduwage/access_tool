// src/workspace-mapping/workspace-mapping.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMapping } from './entities/workspace-mapping.entity';
import { WorkspaceMappingService } from './workspace-mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceMapping])],
  providers: [WorkspaceMappingService],
  exports: [WorkspaceMappingService],
})
export class WorkspaceMappingModule {}