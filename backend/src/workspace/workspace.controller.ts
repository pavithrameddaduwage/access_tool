import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

    @Get()
      async getAllWorkspace() {
        return this.workspaceService.getAllWorkspaces();
      }
    
      @Get(':id')
      async getWorkspaceById(@Param('id') id: number) {
        const workspace = await this.workspaceService.getWorkspaceById(id);
        if (!workspace) {
          throw new NotFoundException(`Workspace with ID ${id} not found.`);
        }
        return workspace;
      }
    
      @Post()
      async createWorkspace(@Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspaceService.createWorkspace(createWorkspaceDto);
      }
    
  
      @Put(':id')
      async updateWorkspace(
        @Param('id') id: number,
        @Body() updateWorkspaceDto: UpdateWorkspaceDto,
      ) {
        const workspace = await this.workspaceService.getWorkspaceById(id);
        if (!workspace) {
          throw new NotFoundException(`Workspace with ID ${id} not found.`);
        }
        return this.workspaceService.updateWorkspace(id, updateWorkspaceDto);
      }
  
  
    
      @Delete(':id')
      async deleteWorkspace (@Param('id') id: number) {
        const workspace = await this.workspaceService.getWorkspaceById(id);
        if (!workspace) {
          throw new NotFoundException(`Workspace with ID ${id} not found.`);
        }
        return this.workspaceService.deleteWorkspace(id);
      }
}
