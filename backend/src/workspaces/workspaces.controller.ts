import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PbiWorkspace } from './entities/pbi-workspace.entity';
import { PbiReport } from './entities/pbi-report.entity';
import { PbiDashboard } from './entities/pbi-dashboard.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';

@Controller('api/workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    @InjectRepository(PbiActivityEvent)
    private readonly activityEventRepository: Repository<PbiActivityEvent>,
  ) {}

  @Get()
  async getAllWorkspaces(): Promise<PbiWorkspace[]> {
    return this.workspacesService.findAllWorkspaces();
  }

  @Post('sync')
  async triggerSync(): Promise<{ message: string }> {
    // Run async in background
    this.workspacesService.syncAll().catch(err => {});
    return { message: 'Sync triggered successfully' };
  }

  @Get(':id')
  async getWorkspaceById(@Param('id') id: string): Promise<PbiWorkspace> {
    return this.workspacesService.findWorkspaceById(id);
  }

  @Get(':id/reports')
  async getReports(@Param('id') id: string): Promise<PbiReport[]> {
    return this.workspacesService.findReportsByWorkspace(id);
  }

  @Get(':id/dashboards')
  async getDashboards(@Param('id') id: string): Promise<PbiDashboard[]> {
    return this.workspacesService.findDashboardsByWorkspace(id);
  }

  @Get(':id/users')
  async getWorkspaceUsers(@Param('id') id: string): Promise<any[]> {
    // Get unique users who have accessed this workspace based on activity events
    const query = await this.activityEventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.user_id', 'userId')
      .addSelect('event.user_email', 'email')
      .where('event.workspace_id = :workspaceId', { workspaceId: id })
      .andWhere('event.user_id IS NOT NULL')
      .getRawMany();

    return query.map(q => ({
      userId: q.userId,
      email: q.email || q.userId,
    }));
  }
}
