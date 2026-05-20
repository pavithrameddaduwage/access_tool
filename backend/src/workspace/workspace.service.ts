import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceService {
    constructor(
      @InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>,
    ) {}


    async createWorkspace(createWorkspaceDto: CreateWorkspaceDto) {
      // Check if workspace already exists
      const existingWorkspace = await this.workspaceRepository.findOne({
        where: { workspace: createWorkspaceDto.workspace }
      });
  
      if (existingWorkspace) {
        throw new ConflictException(`Workspace "${createWorkspaceDto.workspace}" already exists`);
      }
  
      return this.workspaceRepository.save(createWorkspaceDto);
    }
  async getAllWorkspaces() {
    return this.workspaceRepository.find({order: {'workspace':'ASC'}});
  }


  async getWorkspaceById(id: number) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    return workspace;
  }


  async updateWorkspace(id: number, updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    // Check if updated name conflicts with existing workspace
    if (updateWorkspaceDto.workspace && updateWorkspaceDto.workspace !== workspace.workspace) {
      const existingWorkspace = await this.workspaceRepository.findOne({
        where: { workspace: updateWorkspaceDto.workspace }
      });

      if (existingWorkspace && existingWorkspace.id !== id) {
        throw new ConflictException(`Workspace "${updateWorkspaceDto.workspace}" already exists`);
      }
    }

    return this.workspaceRepository.save(Object.assign(workspace, updateWorkspaceDto));
  }


  async deleteWorkspace(id: number) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    try {
      await this.workspaceRepository.remove(workspace);
    } catch (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new ConflictException('Cannot delete Workspace as it is being used by dashboards');
      }
      throw error;
    }
  }

}
