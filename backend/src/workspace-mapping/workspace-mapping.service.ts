// src/workspace-mapping/workspace-mapping.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMapping } from './entities/workspace-mapping.entity';

@Injectable()
export class WorkspaceMappingService {
  constructor(
    @InjectRepository(WorkspaceMapping)
    private readonly workspaceMappingRepository: Repository<WorkspaceMapping>,
  ) {}

  private cleanWorkspaceName(name: string): string {
    if (!name) return 'Unknown Workspace';
    
    // Remove "HGU" prefix (case insensitive)
    let cleaned = name.replace(/^HGU\s*-\s*/i, '')
                     .replace(/^HGU/i, '');
    
    // Remove "Dashboard" suffix (case insensitive)
    cleaned = cleaned.replace(/\s*-\s*Dashboard$/i, '')
                    .replace(/Dashboard$/i, '');
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned || name; // Return original if empty after cleaning
  }

  async findOrCreate(workspaceId: string, originalName: string): Promise<WorkspaceMapping> {
    let mapping = await this.workspaceMappingRepository.findOne({ 
      where: { workspaceId } 
    });

    if (!mapping) {
      mapping = this.workspaceMappingRepository.create({
        workspaceId,
        originalName,
        displayName: this.cleanWorkspaceName(originalName)
      });
      await this.workspaceMappingRepository.save(mapping);
    }

    return mapping;
  }

  async getDisplayName(workspaceId: string, originalName?: string): Promise<string> {
    const mapping = await this.workspaceMappingRepository.findOne({ 
      where: { workspaceId } 
    });

    if (mapping) {
      return mapping.displayName;
    }

    if (originalName) {
      const newMapping = await this.findOrCreate(workspaceId, originalName);
      return newMapping.displayName;
    }

    return 'Unknown Workspace';
  }

  async updateDisplayName(workspaceId: string, displayName: string): Promise<WorkspaceMapping> {
    let mapping = await this.workspaceMappingRepository.findOne({ 
      where: { workspaceId } 
    });

    if (!mapping) {
      throw new Error('Workspace mapping not found');
    }

    mapping.displayName = displayName;
    return this.workspaceMappingRepository.save(mapping);
 
  }

  async findAll(): Promise<WorkspaceMapping[]> {
    return this.workspaceMappingRepository.find();
  }
  
  async findOne(workspaceId: string): Promise<WorkspaceMapping> {
    return this.workspaceMappingRepository.findOne({ 
      where: { workspaceId } 
    });
  }
}