import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PbiWorkspace } from './entities/pbi-workspace.entity';
import { PbiReport } from './entities/pbi-report.entity';
import { PbiDashboard } from './entities/pbi-dashboard.entity';
import { PowerBIService } from '../powerbi/powerbi.service';
import { SyncLogService } from '../sync-log/sync-log.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(PbiWorkspace)
    private workspaceRepository: Repository<PbiWorkspace>,
    @InjectRepository(PbiReport)
    private reportRepository: Repository<PbiReport>,
    @InjectRepository(PbiDashboard)
    private dashboardRepository: Repository<PbiDashboard>,
    private powerBiService: PowerBIService,
    private syncLogService: SyncLogService,
  ) {}

  // Sync workspaces, reports, dashboards from Power BI REST APIs
  async syncAll(): Promise<void> {
    const syncLog = await this.syncLogService.createLog('workspaces');
    try {
      this.logger.log('Starting Power BI workspace, report, and dashboard synchronization...');
      
      // 1. Fetch workspaces (groups)
      const workspacesData = await this.powerBiService.getPaginated<any>('/admin/groups');
      this.logger.log(`Fetched ${workspacesData.length} workspaces from Power BI API.`);

      for (const ws of workspacesData) {
        // Upsert workspace
        await this.workspaceRepository.save({
          workspaceId: ws.id,
          name: ws.name,
          type: ws.type || 'Workspace',
          state: ws.state || 'Active',
          isOnDedicatedCapacity: ws.isOnDedicatedCapacity || false,
          capacityId: ws.capacityId || null,
          description: ws.description || null,
          syncedAt: new Date(),
        });

        // 2. Fetch reports in this workspace
        try {
          const reportsData = await this.powerBiService.get<any>(`/admin/groups/${ws.id}/reports`);
          const reportsList = reportsData?.value || [];
          for (const rep of reportsList) {
            await this.reportRepository.save({
              reportId: rep.id,
              workspaceId: ws.id,
              name: rep.name,
              reportType: rep.reportType || 'PowerBIReport',
              webUrl: rep.webUrl || null,
              embedUrl: rep.embedUrl || null,
              datasetId: rep.datasetId || null,
              syncedAt: new Date(),
            });
          }
        } catch (repError) {
          this.logger.error(`Failed to fetch reports for workspace ${ws.id}`, repError.message);
        }

        // 3. Fetch dashboards in this workspace
        try {
          const dashboardsData = await this.powerBiService.get<any>(`/admin/groups/${ws.id}/dashboards`);
          const dashboardsList = dashboardsData?.value || [];
          for (const db of dashboardsList) {
            await this.dashboardRepository.save({
              dashboardId: db.id,
              workspaceId: ws.id,
              name: db.displayName || db.name,
              isReadOnly: db.isReadOnly || false,
              webUrl: db.webUrl || null,
              embedUrl: db.embedUrl || null,
              syncedAt: new Date(),
            });
          }
        } catch (dbError) {
          this.logger.error(`Failed to fetch dashboards for workspace ${ws.id}`, dbError.message);
        }
      }

      await this.syncLogService.updateLog(syncLog.id, 'success', workspacesData.length);
      this.logger.log('Power BI workspaces, reports, and dashboards sync completed successfully.');
    } catch (error) {
      this.logger.error('Failed to sync Power BI workspaces', error.stack);
      await this.syncLogService.updateLog(syncLog.id, 'failed', 0, error.message);
      throw error;
    }
  }

  // REST APIs
  async findAllWorkspaces(): Promise<PbiWorkspace[]> {
    return this.workspaceRepository.find({ order: { name: 'ASC' } });
  }

  async findWorkspaceById(workspaceId: string): Promise<PbiWorkspace> {
    const ws = await this.workspaceRepository.findOne({ where: { workspaceId } });
    if (!ws) {
      // Try DB uuid lookup
      return this.workspaceRepository.findOne({ where: { id: workspaceId } });
    }
    return ws;
  }

  async findReportsByWorkspace(workspaceId: string): Promise<PbiReport[]> {
    return this.reportRepository.find({ where: { workspaceId } });
  }

  async findDashboardsByWorkspace(workspaceId: string): Promise<PbiDashboard[]> {
    return this.dashboardRepository.find({ where: { workspaceId } });
  }

  async isWorkspacesEmpty(): Promise<boolean> {
    const count = await this.workspaceRepository.count();
    return count === 0;
  }
}
