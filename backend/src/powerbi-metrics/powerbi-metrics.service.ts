// src/powerbi-metrics/powerbi-metrics.service.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, from, forkJoin } from 'rxjs';
import { map, mergeMap, reduce, tap } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios'; 
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { PowerBILog } from './entities/powerbi-log.entity';
import { PowerBITimeSpent } from './entities/powerbi-time-spent.entity';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
import { ReportMappingService } from 'src/report-mapping/report-mapping.service';
import { WorkspaceMappingService } from 'src/workspace-mapping/workspace-mapping.service';
import { UserDashboardService } from 'src/user-dashboard/user-dashboard.service';

export interface PowerBILogEntry {
  Id: string;
  RecordType: number;
  CreationTime: string;
  Operation: string;
  OrganizationId: string;
  UserType: number;
  UserKey: string;
  Workload: string;
  UserId: string;
  ClientIP?: string;
  UserAgent?: string;
  Activity?: string;
  ItemName?: string;
  WorkSpaceName?: string;
  DatasetName?: string;
  ReportName?: string;
  CapacityId?: string;
  CapacityName?: string;
  WorkspaceId?: string;
  ObjectId?: string;
  DatasetId?: string;
  ReportId?: string;
  ArtifactId?: string;
  ArtifactName?: string;
  IsSuccess?: boolean;
  ReportType?: string;
  RequestId?: string;
  ActivityId?: string;
  DistributionMethod?: string;
  ConsumptionMethod?: string;
  ArtifactKind?: string;
  RefreshEnforcementPolicy?: number;
  BillingType?: number;
}

export interface UserMetric {
  userId: string;  
  email?: string;
  userName?: string;
  department?: string;
  count: number;
}
export interface UserDetail {
  id: string;
  email?: string;
  totalViews: number;
  reports: number;
  workspaces: number;
  lastActivity: string;
  activityByDate: {date: string, count: number}[];
}
export interface PowerBIMetrics {
  uniqueUsers: {
    count: number;
    users: string[];
  };
  workspaces: {
    count: number;
    workspaces: Array<{
      id: string;
      name: string;
      views: number;
      uniqueViewers: number;
    }>;
  };
  reports: {
    count: number;
    reports: Array<{
      id: string;
      name: string;
      workspaceId: string;
      workspaceName: string;
      views: number;
      uniqueViewers: number;
    }>;
  };
}

@Injectable()
export class PowerBIMetricsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
      @InjectRepository(UserDashboard)
       private userDashboardRepository: Repository<UserDashboard>,
    @InjectRepository(PowerBILog)
    private readonly powerbiLogRepository: Repository<PowerBILog>,
    @InjectRepository(Dashboard)
    private readonly dashboardRepository: Repository<Dashboard>,
    @InjectRepository(PowerBITimeSpent)
    private readonly powerbiTimeSpentRepository: Repository<PowerBITimeSpent>,
    private readonly reportMappingService: ReportMappingService,
    private readonly workspaceMappingService: WorkspaceMappingService,
    private readonly userDashboardService: UserDashboardService,

  ) {}
  

  private readonly logger = new Logger(PowerBIMetricsService.name);
  public async getAccessToken(): Promise<string> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Power BI credentials are not configured');
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await this.httpService.post(tokenEndpoint, params).toPromise();
    return response.data.access_token;
  }

  public async getOffice365ManagementApiAccessToken(): Promise<string> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Office 365 Management API credentials are not configured');
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'https://manage.office.com/.default');
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await this.httpService.post(tokenEndpoint, params).toPromise();
    return response.data.access_token;
  }

  public async getWorkspaceMembers(groupId: string): Promise<any[]> {
    if (groupId === '000000') {
      this.logger.warn(`Skip workspace members lookup for personal workspace placeholder id ${groupId}`);
      return [];
    }

    const accessToken = await this.getAccessToken();
    try {
      const response = await this.httpService.get(
        `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/users`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ).toPromise();

      const responseData = response?.data;
      if (Array.isArray(responseData)) {
        return responseData;
      }
      return responseData?.value || [];
    } catch (error: any) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to load workspace members';
      this.logger.error(`Failed to load members for workspace ${groupId}: ${message}`, error?.stack);
      throw new HttpException({ message }, status);
    }
  }

  public async addWorkspaceMember(groupId: string, payload: { emailAddress: string; accessRight: string }): Promise<any> {
    const accessToken = await this.getAccessToken();
    const response = await this.httpService.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/users`,
      {
        emailAddress: payload.emailAddress,
        accessRight: payload.accessRight || 'Viewer',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    ).toPromise();

    return response?.data || { success: true };
  }

  public async updateWorkspaceMember(groupId: string, userId: string, payload: { accessRight: string }): Promise<any> {
    const accessToken = await this.getAccessToken();
    const response = await this.httpService.patch(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/users/${userId}`,
      {
        accessRight: payload.accessRight,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    ).toPromise();

    return response?.data || { success: true };
  }

  public async removeWorkspaceMember(groupId: string, userId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const response = await this.httpService.delete(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    ).toPromise();

    return response?.data || { success: true };
  }

  public async ensureSubscription(accessToken: string): Promise<void> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const baseUrl = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions`;
    
    try {
      // First check existing subscriptions
      const { data: subscriptions } = await this.httpService.get<string[]>(
        `${baseUrl}/list`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ).toPromise();
  
      if (subscriptions.includes('Audit.General')) return;
  
      // Attempt to create subscription (empty body)
      await this.httpService.post(
        `${baseUrl}/start`,
        null,
        {
          params: { contentType: 'Audit.General' },
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();
      
    } catch (error) {
      // Ignore "already exists" errors
      if (error.response?.data?.error?.code === 'AF20024') return;
      
      // Log other errors but don't throw
      // console.warn('Subscription check completed with warnings:', {
      //   status: error.response?.status,
      //   code: error.response?.data?.error?.code,
      //   message: error.response?.data?.error?.message || error.message
      // });
    }
  }

  public async getLogEntries(contentUri: string, accessToken: string): Promise<PowerBILogEntry[]> {
    const response = await this.httpService.get(
      contentUri,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ).toPromise();
    
    // Filter for PowerBI entries only
    return response.data.filter(entry => entry.Workload === 'PowerBI');
  }




  async getWorkspaceMetrics(workspaceId: string, startDate: Date, endDate: Date): Promise<any> {
    const metrics = await this.getPowerBIMetrics(startDate, endDate);
    const allLogEntries = await this.getLogsFromDatabase(startDate, endDate);
    
    const workspace = metrics.workspaces.workspaces.find(w => w.id === workspaceId);
    const workspaceReports = metrics.reports.reports.filter(r => r.workspaceId === workspaceId);
    
    return {
      workspace: workspace || { id: workspaceId, name: 'Unknown', views: 0, uniqueViewers: 0 },
      reports: workspaceReports,
      totalReports: workspaceReports.length,
      totalViews: workspaceReports.reduce((total, report) => total + report.views, 0),
      uniqueViewers: [...new Set(allLogEntries
        .filter(entry => entry.WorkspaceId === workspaceId && entry.Operation === 'ViewReport')
        .map(entry => entry.UserId)
      )].length
    };
  }
  // Add this helper method to your service

  async getReportMetrics(reportId: string, startDate: Date, endDate: Date): Promise<any> {
    const metrics = await this.getPowerBIMetrics(startDate, endDate);
    const allLogEntries = await this.getLogsFromDatabase(startDate, endDate); // Get the log entries from the saved DB
    
    const report = metrics.reports.reports.find(r => r.id === reportId);
    
    if (!report) {
      return {
        report: { id: reportId, name: 'Unknown', views: 0, uniqueViewers: 0 },
        viewers: []
      };
    }
    
    const reportViewers = [...new Set(allLogEntries
      .filter(entry => entry.ReportId === reportId && entry.Operation === 'ViewReport')
      .map(entry => entry.UserId))];
    
    return {
      report,
      viewers: reportViewers,
      viewsByDay: this.getViewsByDay(reportId, startDate, endDate, allLogEntries)
    };
  }

  private getViewsByDay(reportId: string, startDate: Date, endDate: Date, logEntries: PowerBILogEntry[]): any[] {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const dailyViews = logEntries.filter(entry => 
        entry.ReportId === reportId && 
        entry.Operation === 'ViewReport' && 
        entry.CreationTime.startsWith(dateString)
      ).length;
      
      result.push({
        date: dateString,
        views: dailyViews
      });
    }
    
    return result;
  }

  // public processLogEntries(entries: PowerBILogEntry[]): PowerBIMetrics {
  //   // Process all unique users
  //   const users = [...new Set(entries.map(entry => entry.UserId))];
    
  //   // Process workspaces
  //   const workspacesMap = new Map<string, {
  //     id: string;
  //     name: string;
  //     views: number;
  //     viewerSet: Set<string>;
  //   }>();
    
  //   // Process reports
  //   const reportsMap = new Map<string, {
  //     id: string;
  //     name: string;
  //     workspaceId: string;
  //     workspaceName: string;
  //     views: number;
  //     viewerSet: Set<string>;
  //   }>();
    
  //   // Populate the maps
  //   entries.forEach(entry => {
  //     // Only count view operations
  //     if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
  //       // Update workspace metrics
  //       if (entry.WorkspaceId) {
  //         if (!workspacesMap.has(entry.WorkspaceId)) {
  //           workspacesMap.set(entry.WorkspaceId, {
  //             id: entry.WorkspaceId,
  //             name: entry.WorkSpaceName || 'Unknown',
  //             views: 0,
  //             viewerSet: new Set<string>()
  //           });
  //         }
          
  //         const workspace = workspacesMap.get(entry.WorkspaceId);
  //         workspace.views += 1;
  //         workspace.viewerSet.add(entry.UserId);
  //       }
        
  //       // Update report metrics (only for ViewReport operations)
  //       if (entry.Operation === 'ViewReport' && entry.ReportId) {
  //         if (!reportsMap.has(entry.ReportId)) {
  //           reportsMap.set(entry.ReportId, {
  //             id: entry.ReportId,
  //             name: entry.ReportName || entry.ArtifactName || 'Unknown',
  //             workspaceId: entry.WorkspaceId || 'Unknown',
  //             workspaceName: entry.WorkSpaceName || 'Unknown',
  //             views: 0,
  //             viewerSet: new Set<string>()
  //           });
  //         }
          
  //         const report = reportsMap.get(entry.ReportId);
  //         report.views += 1;
  //         report.viewerSet.add(entry.UserId);
  //       }
  //     }
  //   });
    
  //   // Convert maps to arrays for the response
  //   const workspaces = Array.from(workspacesMap.values()).map(workspace => ({
  //     id: workspace.id,
  //     name: workspace.name,
  //     views: workspace.views,
  //     uniqueViewers: workspace.viewerSet.size
  //   }));
    
  //   const reports = Array.from(reportsMap.values()).map(report => ({
  //     id: report.id,
  //     name: report.name,
  //     workspaceId: report.workspaceId,
  //     workspaceName: report.workspaceName,
  //     views: report.views,
  //     uniqueViewers: report.viewerSet.size
  //   }));
    
  //   return {
  //     uniqueUsers: {
  //       count: users.length,
  //       users
  //     },
  //     workspaces: {
  //       count: workspaces.length,
  //       workspaces
  //     },
  //     reports: {
  //       count: reports.length,
  //       reports
  //     }
  //   };
  // }


  public async processLogEntries(entries: PowerBILogEntry[]): Promise<PowerBIMetrics> {
    // Process all unique users
    const users = [...new Set(entries.map(entry => entry.UserId))];
    
    // Process workspaces
    const workspacesMap = new Map<string, {
      id: string;
      name: string;
      views: number;
      viewerSet: Set<string>;
    }>();
    
    // Process reports
    const reportsMap = new Map<string, {
      id: string;
      name: string;
      workspaceId: string;
      workspaceName: string;
      views: number;
      viewerSet: Set<string>;
    }>();
    
    // First pass - create all mappings
    for (const entry of entries) {
      if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
        // Create workspace mapping if needed
        if (entry.WorkspaceId) {
          await this.workspaceMappingService.findOrCreate(
            entry.WorkspaceId,
            entry.WorkSpaceName || 'Unknown'
          );
        }
        
        // Create report mapping if needed
        if (entry.Operation === 'ViewReport' && entry.ReportId) {
          await this.reportMappingService.findOrCreate(
            entry.ReportId,
            entry.ReportName || entry.ArtifactName || 'Unknown',
            entry.WorkspaceId
          );
        }
      }
    }
    
    // Second pass - process metrics with mapped names
    for (const entry of entries) {
      // Only count view operations
      if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
        // Update workspace metrics
        if (entry.WorkspaceId) {
          const workspaceDisplayName = await this.workspaceMappingService.getDisplayName(
            entry.WorkspaceId,
            entry.WorkSpaceName
          );
          
          if (!workspacesMap.has(entry.WorkspaceId)) {
            workspacesMap.set(entry.WorkspaceId, {
              id: entry.WorkspaceId,
              name: workspaceDisplayName,
              views: 0,
              viewerSet: new Set<string>()
            });
          }
          
          const workspace = workspacesMap.get(entry.WorkspaceId);
          workspace.views += 1;
          workspace.viewerSet.add(entry.UserId);
        }
        
        // Update report metrics (only for ViewReport operations)
        if (entry.Operation === 'ViewReport' && entry.ReportId) {
          const reportDisplayName = await this.reportMappingService.getDisplayName(
            entry.ReportId,
            entry.ReportName || entry.ArtifactName
          );
          
          const workspaceDisplayName = entry.WorkspaceId 
            ? await this.workspaceMappingService.getDisplayName(
                entry.WorkspaceId,
                entry.WorkSpaceName
              )
            : 'Unknown';
          
          if (!reportsMap.has(entry.ReportId)) {
            reportsMap.set(entry.ReportId, {
              id: entry.ReportId,
              name: reportDisplayName,
              workspaceId: entry.WorkspaceId || 'Unknown',
              workspaceName: workspaceDisplayName,
              views: 0,
              viewerSet: new Set<string>()
            });
          }
          
          const report = reportsMap.get(entry.ReportId);
          report.views += 1;
          report.viewerSet.add(entry.UserId);
        }
      }
    }
    
    // Convert maps to arrays for the response
    const workspaces = Array.from(workspacesMap.values()).map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      views: workspace.views,
      uniqueViewers: workspace.viewerSet.size
    }));
    
    const reports = Array.from(reportsMap.values()).map(report => ({
      id: report.id,
      name: report.name,
      workspaceId: report.workspaceId,
      workspaceName: report.workspaceName,
      views: report.views,
      uniqueViewers: report.viewerSet.size
    }));
    
    return {
      uniqueUsers: {
        count: users.length,
        users
      },
      workspaces: {
        count: workspaces.length,
        workspaces
      },
      reports: {
        count: reports.length,
        reports
      }
    };
  }
  async getPowerBIMetrics(startDate: Date, endDate: Date): Promise<PowerBIMetrics> {
    // First get all relevant logs
    const logs = await this.getLogsFromDatabase(startDate, endDate);
    
    // Get all unique users across all workspaces
    const allUserIds = [...new Set(logs.map(log => log.UserId))];
    
    // Get all unique reports across all workspaces
    const allReportIds = [...new Set(logs
      .filter(log => log.ReportId)
      .map(log => log.ReportId))];
    
    // Process workspace-specific metrics
    const workspacesMap = new Map<string, {
      id: string;
      name: string;
      views: number;
      viewerSet: Set<string>;
    }>();
    
    // Process reports
    const reportsMap = new Map<string, {
      id: string;
      name: string;
      workspaceId: string;
      workspaceName: string;
      views: number;
      viewerSet: Set<string>;
    }>();
    
    // Populate the maps
    logs.forEach(entry => {
      if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
        // Update workspace metrics
        if (entry.WorkspaceId) {  // Uppercase W
          if (!workspacesMap.has(entry.WorkspaceId)) {
            workspacesMap.set(entry.WorkspaceId, {
              id: entry.WorkspaceId,  // Uppercase W
              name: entry.WorkSpaceName || 'Unknown',  // Uppercase W
              views: 0,
              viewerSet: new Set<string>()
            });
          }
          
          const workspace = workspacesMap.get(entry.WorkspaceId);
          workspace.views += 1;
          workspace.viewerSet.add(entry.UserId);  // Uppercase U
        }
        
        // Update report metrics
        if (entry.Operation === 'ViewReport' && entry.ReportId) {  // Uppercase R
          if (!reportsMap.has(entry.ReportId)) {
            reportsMap.set(entry.ReportId, {
              id: entry.ReportId,  // Uppercase R
              name: entry.ReportName || entry.ArtifactName || 'Unknown',  // Uppercase R
              workspaceId: entry.WorkspaceId || 'Unknown',  // Uppercase W
              workspaceName: entry.WorkSpaceName || 'Unknown',  // Uppercase W
              views: 0,
              viewerSet: new Set<string>()
            });
          }
          
          const report = reportsMap.get(entry.ReportId);
          report.views += 1;
          report.viewerSet.add(entry.UserId);  // Uppercase U
        }
      }
    });
    
    // Convert maps to arrays
    const workspaces = Array.from(workspacesMap.values()).map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      views: workspace.views,
      uniqueViewers: workspace.viewerSet.size
    }));
    
    const reports = Array.from(reportsMap.values()).map(report => ({
      id: report.id,
      name: report.name,
      workspaceId: report.workspaceId,
      workspaceName: report.workspaceName,
      views: report.views,
      uniqueViewers: report.viewerSet.size
    }));
    
    return {
      uniqueUsers: {
        count: allUserIds.length,  // Now shows total unique users across all workspaces
        users: allUserIds
      },
      workspaces: {
        count: workspaces.length,
        workspaces
      },
      reports: {
        count: allReportIds.length,  // Now shows total unique reports across all workspaces
        reports
      }
    };
  }

  async saveRawLogs(logs: PowerBILogEntry[]): Promise<void> {
    if (!logs || logs.length === 0) {
      return;
    }
    
    // De-duplicate in-memory by log.Id within the same batch
    const uniqueIncomingMap = new Map<string, PowerBILogEntry>();
    for (const log of logs) {
      if (log && log.Id) {
        uniqueIncomingMap.set(log.Id, log);
      }
    }
    const uniqueIncomingLogs = Array.from(uniqueIncomingMap.values());

    const filteredLogs = await this.filterExistingLogs(uniqueIncomingLogs);
    if (filteredLogs.length === 0) {
      this.logger.log('All logs are duplicates, skipping database insertion.');
      return;
    }
    const entities = filteredLogs.map(log => {
      const cleanedWorkspaceName = log.WorkSpaceName?.startsWith('PersonalWorkspace')
        ? 'PersonalWorkspace'
        : log.WorkSpaceName;
  
      return this.powerbiLogRepository.create({
        id: log.Id,
        recordType: log.RecordType,
        creationTime: new Date(log.CreationTime + 'Z'), 
        operation: log.Operation,
        organizationId: log.OrganizationId,
        userType: log.UserType,
        userKey: log.UserKey,
        workload: log.Workload,
        userId: log.UserId,
        clientIP: log.ClientIP,
        userAgent: log.UserAgent,
        activity: log.Activity,
        itemName: log.ItemName,
        workSpaceName: cleanedWorkspaceName,
        datasetName: log.DatasetName,
        reportName: log.ReportName,
        capacityId: log.CapacityId,
        capacityName: log.CapacityName,
        workspaceId: log.WorkspaceId,
        objectId: log.ObjectId,
        datasetId: log.DatasetId,
        reportId: log.ReportId,
        artifactId: log.ArtifactId,
        artifactName: log.ArtifactName,
        isSuccess: log.IsSuccess,
        reportType: log.ReportType,
        requestId: log.RequestId,
        activityId: log.ActivityId,
        distributionMethod: log.DistributionMethod,
        consumptionMethod: log.ConsumptionMethod,
        artifactKind: log.ArtifactKind,
        refreshEnforcementPolicy: log.RefreshEnforcementPolicy,
        billingType: log.BillingType,
      });
    });
  
    await this.powerbiLogRepository.save(entities);
    // After saving raw logs, infer time-spent per user/report/tab and persist to PowerBITimeSpent
    try {
      // Use only real inter-event gaps — no hardcoded fallback durations.
      // A session boundary is detected when the gap between consecutive events
      // exceeds the maximum realistic continuous-viewing window (1 hour).
      // Gaps beyond that threshold or for the final event in a session are skipped
      // so that only measured time is recorded.
      const MAX_SESSION_GAP_MS = 60 * 60 * 1000; // 1 hour — sessions reset beyond this

      // Group logs by userId + reportId
      const grouped: Record<string, PowerBILogEntry[]> = {};
      for (const l of filteredLogs) {
        const userId = (l.UserId || '').toLowerCase();
        const reportId = l.ReportId || '';
        if (!userId || !reportId) continue; // require both to attribute time
        const key = `${userId}::${reportId}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(l);
      }

      const aggregated: Record<string, { userId: string; reportId: string; reportName?: string; workspaceId?: string; workspaceName?: string; tabName: string; seconds: number; }> = {};

      for (const key of Object.keys(grouped)) {
        const logsForKey = grouped[key].sort((a, b) => new Date(a.CreationTime).getTime() - new Date(b.CreationTime).getTime());
        for (let i = 0; i < logsForKey.length; i++) {
          const cur = logsForKey[i];
          const next = logsForKey[i + 1];

          // Only record time when we have a real, measurable gap within the session window.
          // The last event in a session contributes no duration (no fabricated default).
          if (!next) continue;
          const diff = new Date(next.CreationTime).getTime() - new Date(cur.CreationTime).getTime();
          if (diff <= 0 || diff > MAX_SESSION_GAP_MS) continue;

          const tabName = cur.ArtifactName || cur.ItemName || cur.ReportName || 'Main Page';
          const aggKey = `${(cur.UserId || '').toLowerCase()}::${cur.ReportId || ''}::${tabName}`;
          if (!aggregated[aggKey]) {
            aggregated[aggKey] = {
              userId: (cur.UserId || '').toLowerCase(),
              reportId: cur.ReportId || '',
              reportName: cur.ReportName,
              workspaceId: cur.WorkspaceId,
              workspaceName: cur.WorkSpaceName,
              tabName,
              seconds: 0
            };
          }
          aggregated[aggKey].seconds += Math.round(diff / 1000);
        }
      }

      const timeSpentEntries = Object.values(aggregated).filter(a => a.reportId && a.userId && a.seconds > 0);
      for (const entry of timeSpentEntries) {
        try {
          await this.saveTimeSpent({
            userId: entry.userId,
            reportId: entry.reportId,
            reportName: entry.reportName || 'Unknown Report',
            workspaceId: entry.workspaceId,
            workspaceName: entry.workspaceName,
            tabName: entry.tabName,
            durationSeconds: entry.seconds,
          });
        } catch (err) {
          this.logger.error('Failed to save inferred time-spent entry', err.stack);
        }
      }
      this.logger.log(`Persisted ${timeSpentEntries.length} inferred time-spent entries from logs.`);
    } catch (err) {
      this.logger.error('Failed to process raw logs into time-spent entries', err.stack);
    }
  }
  

  // async getUserReportViewsDistribution(
  //   userId: string, 
  //   startDate: Date, 
  //   endDate: Date,
  //   workspaceId?: string
  // ): Promise<{reportId: string, reportName: string, count: number}[]> {
  //   const query = this.powerbiLogRepository
  //     .createQueryBuilder('log')
  //     .select('log.reportId', 'reportId')
  //     .addSelect('log.reportName', 'reportName')
  //     .addSelect('COUNT(*)', 'count')
  //     .where('log.userId = :userId', { userId })
  //     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
  //     .andWhere("log.operation = 'ViewReport'")
  //     .andWhere('log.reportId IS NOT NULL');
  
  //   if (workspaceId && workspaceId !== 'all') {
  //     query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  //   }
  
  //   const results = await query
  //     .groupBy('log.reportId, log.reportName')
  //     .orderBy('COUNT(*)', 'DESC')
  //     .getRawMany();
  
  //   return results.map(r => ({
  //     reportId: r.reportId,
  //     reportName: r.reportName || 'Unknown Report',
  //     count: parseInt(r.count)
  //   }));
  // }


  //new one
  
  // async getUserReportViewsDistribution(
  //   userId: string, 
  //   startDate: Date, 
  //   endDate: Date,
  //   workspaceId?: string
  // ): Promise<{reportId: string, reportName: string, workspaceName: string, count: number}[]> {
  //   // First convert the input dates to UTC start/end of day in EDT timezone
  //   const edtStart = this.convertToEdtStartOfDay(startDate);
  //   const edtEnd = this.convertToEdtEndOfDay(endDate);
    
  //   const query = this.powerbiLogRepository
  //     .createQueryBuilder('log')
  //     .select('log.reportId', 'reportId')
  //     .addSelect('log.reportName', 'reportName')
  //     .addSelect('log.workSpaceName', 'workspaceName') // Add this line
  //     .addSelect('log.creationTime', 'creationTime')
  //     .where('log.userId = :userId', { userId })
  //     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { 
  //       startDate: edtStart, 
  //       endDate: edtEnd 
  //     })
  //     .andWhere("log.operation = 'ViewReport'")
  //     .andWhere('log.reportId IS NOT NULL');
  
  //     if (workspaceId) {
  //       if (workspaceId === '000000') {
  //         query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
  //       } else {
  //         query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
  //       }
  //     }
  
  //   const rawLogs = await query.getRawMany();
    
  //   const reportViews = new Map<string, {reportId: string, reportName: string, workspaceName: string, count: number}>();
    
  //   rawLogs.forEach(log => {
  //     const key = log.reportId;
  //     const reportName = log.reportName || 'Unknown Report';
  //     const workspaceName = log.workspaceName || 'Unknown Workspace';
      
  //     if (!reportViews.has(key)) {
  //       reportViews.set(key, {
  //         reportId: key,
  //         reportName: reportName,
  //         workspaceName: workspaceName,
  //         count: 0
  //       });
  //     }
      
  //     reportViews.get(key)!.count += 1;
  //   });
    
  //   return Array.from(reportViews.values())
  //     .sort((a, b) => b.count - a.count);
  // }
  

  async getUserReportViewsDistribution(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    workspaceId?: string
  ): Promise<{reportId: string, reportName: string, workspaceName: string, count: number}[]> {
    // First convert the input dates to UTC start/end of day in EDT timezone
    const edtStart = this.convertToEdtStartOfDay(startDate);
    const edtEnd = this.convertToEdtEndOfDay(endDate);
    
    const query = this.powerbiLogRepository
      .createQueryBuilder('log')
      .select('log.reportId', 'reportId')
      .addSelect('log.reportName', 'originalReportName')
      .addSelect('log.workspaceId', 'workspaceId')
      .addSelect('log.workSpaceName', 'originalWorkspaceName')
      .addSelect('log.creationTime', 'creationTime')
      .where('log.userId = :userId', { userId })
      .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { 
        startDate: edtStart, 
        endDate: edtEnd 
      })
      .andWhere("log.operation = 'ViewReport'")
      .andWhere('log.reportId IS NOT NULL');
  
    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }
  
    const rawLogs = await query.getRawMany();
    
    const reportViews = new Map<string, {reportId: string, reportName: string, workspaceName: string, count: number}>();
    
    for (const log of rawLogs) {
      // Get mapped names
      const [reportName, workspaceName] = await Promise.all([
        this.reportMappingService.getDisplayName(log.reportId, log.originalReportName),
        this.workspaceMappingService.getDisplayName(log.workspaceId, log.originalWorkspaceName)
      ]);
      
      const key = log.reportId;
      
      if (!reportViews.has(key)) {
        reportViews.set(key, {
          reportId: key,
          reportName: reportName,
          workspaceName: workspaceName,
          count: 0
        });
      }
      
      reportViews.get(key)!.count += 1;
    }
    
    return Array.from(reportViews.values())
      .sort((a, b) => b.count - a.count);
  }
  // Helper methods for EDT timezone conversion
  private convertToEdtStartOfDay(date: Date): Date {
    // Convert to EDT start of day (00:00:00)
    const edtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    edtDate.setHours(0, 0, 0, 0);
    return edtDate;
  }
  
  private convertToEdtEndOfDay(date: Date): Date {
    // Convert to EDT end of day (23:59:59)
    const edtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    edtDate.setHours(23, 59, 59, 999);
    return edtDate;
  }
  getAllLogs() {
    return this.powerbiLogRepository.find();
  }
  private async getLogsFromDatabase(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<PowerBILogEntry[]> {
    const query = this.powerbiLogRepository.createQueryBuilder('log')
      .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('log.workload = :workload', { workload: 'PowerBI' })
      .andWhere('log.operation = :operation', { operation: 'ViewReport' })
      .orderBy('log.creationTime', 'ASC');

    if (workspaceId) {
      query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
    }

    if (reportId) {
      query.andWhere('log.reportId = :reportId', { reportId });
    }

    const logs = await query.getMany();
  
    return logs.map(log => ({
      Id: log.id,
      RecordType: log.recordType,
      CreationTime: log.creationTime.toISOString(),
      Operation: log.operation,
      OrganizationId: log.organizationId,
      UserType: log.userType,
      UserKey: log.userKey,
      Workload: log.workload,
      UserId: log.userId,
      ClientIP: log.clientIP,
      UserAgent: log.userAgent,
      Activity: log.activity,
      ItemName: log.itemName,
      WorkSpaceName: log.workSpaceName,
      DatasetName: log.datasetName,
      ReportName: log.reportName,
      CapacityId: log.capacityId,
      CapacityName: log.capacityName,
      WorkspaceId: log.workspaceId,
      ObjectId: log.objectId,
      DatasetId: log.datasetId,
      ReportId: log.reportId,
      ArtifactId: log.artifactId,
      ArtifactName: log.artifactName,
      IsSuccess: log.isSuccess,
      ReportType: log.reportType,
      RequestId: log.requestId,
      ActivityId: log.activityId,
      DistributionMethod: log.distributionMethod,
      ConsumptionMethod: log.consumptionMethod,
      ArtifactKind: log.artifactKind,
      RefreshEnforcementPolicy: log.refreshEnforcementPolicy,
      BillingType: log.billingType,
    }));
  }

  public async getDatabaseLogEntries(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<PowerBILogEntry[]> {
    return this.getLogsFromDatabase(startDate, endDate, workspaceId, reportId);
  }

  private async fetchAndProcessLogs(contentUri: string, accessToken: string): Promise<PowerBILogEntry[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(contentUri, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      );

      // Filter for Power BI ViewReport operations
      return response.data
        .filter(entry => 
          entry.Workload === 'PowerBI' && 
          entry.Operation === 'ViewReport'
        )
        .map(entry => ({
          Id: entry.Id,
          UserId: entry.UserId,
          CreationTime: entry.CreationTime,
          Operation: entry.Operation,
          WorkSpaceName: entry.WorkSpaceName,
          WorkspaceId: entry.WorkspaceId,
          ReportId: entry.ReportId,
          ReportName: entry.ReportName,
          // Include other relevant fields
        }));
    } catch (error) {
      // console.error(`Failed to process ${contentUri}:`, error.message);
      return [];
    }
  }


  private emptyMetricsResponse(): PowerBIMetrics {
    return {
      uniqueUsers: { count: 0, users: [] },
      workspaces: { count: 0, workspaces: [] },
      reports: { count: 0, reports: [] }
    };
  }

  public async getAllLogEntries(startDate: Date, endDate: Date): Promise<PowerBILogEntry[]> {
    const accessToken = await this.getAccessToken();
    await this.ensureSubscription(accessToken);
    
    const contentUris = await this.getContentUris(accessToken, startDate, endDate);
    const logPromises = contentUris.map(uri => this.getLogEntries(uri, accessToken));
    const logEntriesArrays = await Promise.all(logPromises);
    
    return logEntriesArrays.flat();
  }

public async getContentUris(accessToken: string, startDate: Date, endDate: Date): Promise<string[]> {
  const tenantId = this.configService.get<string>('TENANT_ID');
  
  // Format dates exactly as required
  const formatDate = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  
  const endpoint = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions/content` +
    `?contentType=Audit.General` +
    `&startTime=${formatDate(startDate)}` +
    `&endTime=${formatDate(endDate)}`;

  const response = await this.httpService.get(endpoint, {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }).toPromise();

  return response.data.map(item => item.contentUri);
}




public async collectDailyLogs(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Set time range for full day (00:00:00 to 23:59:59)
  const startDate = new Date(yesterday);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(yesterday);
  endDate.setHours(23, 59, 59, 999);

  this.logger.log(`Starting daily log collection for ${startDate.toISOString()} to ${endDate.toISOString()}`);

  try {
    // First check if we already have data for this date range
    const existingCount = await this.powerbiLogRepository.count({
      where: {
        creationTime: Between(startDate, endDate),
        workload: 'PowerBI',
        operation: 'ViewReport',
      },
    });

    if (existingCount > 0) {
      this.logger.warn(`Already have ${existingCount} logs for this date range, skipping collection`);
      return;
    }

    const accessToken = await this.getAccessToken();
    await this.ensureSubscription(accessToken);
    
    const contentUris = await this.getContentUris(accessToken, startDate, endDate);
    const allLogs = await Promise.all(
      contentUris.map(uri => 
        this.getLogEntries(uri, accessToken)
          .catch(e => {
            this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
            return [];
          })
      )
    );

    const powerBILogs = allLogs.flat().filter(
      entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport'
    );

    // Additional duplicate check at the record level
    const newLogs = await this.filterExistingLogs(powerBILogs);
    
    if (newLogs.length > 0) {
      await this.saveRawLogs(newLogs);
      this.logger.log(`Successfully saved ${newLogs.length} new logs`);
    } else {
      this.logger.log('No new logs to save');
    }
  } catch (error) {
    this.logger.error('Failed to collect daily logs', error.stack);
  }
}


private async filterExistingLogs(logs: PowerBILogEntry[]): Promise<PowerBILogEntry[]> {
  const existingIds = await this.powerbiLogRepository.find({
    where: {
      id: In(logs.map(l => l.Id)),
    },
    select: ['id'],
  });

  const existingIdSet = new Set(existingIds.map(l => l.id));
  return logs.filter(log => !existingIdSet.has(log.Id));
}




// async getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Promise<{id: string, name: string}[]> {
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.workspaceId', 'id')
//     .addSelect('log.workSpaceName', 'name')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.workspaceId IS NOT NULL')
//     .distinct(true);

//   if (reportId) {
//     query.andWhere('log.reportId = :reportId', { reportId });
//   }

//   const results = await query.getRawMany();

//   // Group by workspace name, handling PersonalWorkspace specially
//   const workspaceMap = new Map<string, {id: string, name: string}>();
  
//   results.forEach(r => {
//     const name = r.name || 'Unknown Workspace';
    
//     if (name === 'PersonalWorkspace') {
//       // Use a consistent ID for all PersonalWorkspace entries
//       if (!workspaceMap.has('PersonalWorkspace')) {
//         workspaceMap.set('PersonalWorkspace', {
//           id: '000000', // Use the same ID you used in the frontend
//           name: 'Personal Workspace'
//         });
//       }
//     } else {
//       workspaceMap.set(r.id, {
//         id: r.id,
//         name: name
//       });
//     }
//   });
  
//   return Array.from(workspaceMap.values());
// }
async getViewCountsByDate(
  startDate: Date, 
  endDate: Date, 
  workspaceId?: string, 
  reportId?: string
): Promise<{date: string, count: number}[]> {
  console.log("date time", startDate, endDate);
  
  // Query remains the same - working with UTC in the database
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .select(['log.creationTime']);

    if (workspaceId && workspaceId !== 'all') {
      if (workspaceId === '000000') {
        // Special case for PersonalWorkspace
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        // Normal case for regular workspaces
        query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
      }
    }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const logs = await query.getMany();
  const counts = new Map<string, number>();
  
  // console.log("logs", logs);

  // Convert UTC to EDT when processing the logs
  logs.forEach(log => {
    // Convert UTC date to EDT
    const utcDate = new Date(log.creationTime);
    
    // Options for converting to EDT
    const options = { timeZone: 'America/New_York' };
    
    // Format date in EDT timezone
    const edtDateString = utcDate.toLocaleDateString('en-US', options);
    const edtDateParts = edtDateString.split('/');
    
    // Format as YYYY-MM-DD
    const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;
    
    // console.log("log creation time (EDT)", dateKey);
    counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// async getUserActivityTrend(
//   startDate: Date, 
//   endDate: Date, 
//   workspaceId?: string, 
//   reportId?: string
// ): Promise<{date: string, count: number}[]> {
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .select(['log.creationTime', 'log.userId']);

//   if (workspaceId && workspaceId !== 'all') {
//     query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
//   }

//   if (reportId) {
//     query.andWhere('log.reportId = :reportId', { reportId });
//   }

//   const logs = await query.getMany();

//   const dailyActiveUsers = new Map<string, Set<string>>();

//   logs.forEach(log => {
//     const dateKey = log.creationTime.toISOString().split('T')[0]; 

//     if (!dailyActiveUsers.has(dateKey)) {
//       dailyActiveUsers.set(dateKey, new Set());
//     }

//     dailyActiveUsers.get(dateKey)?.add(log.userId);
//   });

//   return Array.from(dailyActiveUsers.entries())
//     .map(([date, users]) => ({
//       date,
//       count: users.size 
//     }))
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
// }
//n ew one
// async getUserActivityTrend(
//   startDate: Date, 
//   endDate: Date, 
//   workspaceId?: string, 
//   reportId?: string
// ): Promise<{date: string, count: number}[]> {
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .select(['log.creationTime', 'log.userId']);

//     if (workspaceId) {
//       if (workspaceId === '000000') {
//         query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
//       } else {
//         query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
//       }
//     }

//   if (reportId) {
//     query.andWhere('log.reportId = :reportId', { reportId });
//   }

//   const logs = await query.getMany();

//   const dailyActiveUsers = new Map<string, Set<string>>();

//   logs.forEach(log => {
//     // Convert UTC date to EDT
//     const utcDate = new Date(log.creationTime);
    
//     // Options for converting to EDT
//     const options = { timeZone: 'America/New_York' };
    
//     // Format date in EDT timezone
//     const edtDateString = utcDate.toLocaleDateString('en-US', options);
//     const edtDateParts = edtDateString.split('/');
    
//     // Format as YYYY-MM-DD
//     const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;

//     if (!dailyActiveUsers.has(dateKey)) {
//       dailyActiveUsers.set(dateKey, new Set());
//     }

//     dailyActiveUsers.get(dateKey)?.add(log.userId);
//   });

//   return Array.from(dailyActiveUsers.entries())
//     .map(([date, users]) => ({
//       date,
//       count: users.size 
//     }))
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
// }
async getUserActivityTrend(
  startDate: Date, 
  endDate: Date, 
  workspaceId?: string, 
  reportId?: string
): Promise<{date: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .select(['log.creationTime', 'log.userId']);

  if (workspaceId) {
    if (workspaceId === '000000') {
      query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
    } else {
      query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
    }
  }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const logs = await query.getMany();
  const dailyActiveUsers = new Map<string, Set<string>>();

  logs.forEach(log => {
    // Convert UTC date to EDT
    const utcDate = new Date(log.creationTime);
    
    // Options for converting to EDT
    const options = { timeZone: 'America/New_York' };
    
    // Format date in EDT timezone
    const edtDateString = utcDate.toLocaleDateString('en-US', options);
    const edtDateParts = edtDateString.split('/');
    
    // Format as YYYY-MM-DD
    const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;

    if (!dailyActiveUsers.has(dateKey)) {
      dailyActiveUsers.set(dateKey, new Set());
    }

    dailyActiveUsers.get(dateKey)?.add(log.userId);
  });

  return Array.from(dailyActiveUsers.entries())
    .map(([date, users]) => ({
      date,
      count: users.size 
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
// async getDistinctReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{id: string, name: string, workspaceId: string}[]> {
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.reportId', 'id')
//     .addSelect('log.reportName', 'name')
//     .addSelect('log.workspaceId', 'workspaceId')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.reportId IS NOT NULL')
//     .distinct(true);

//     if (workspaceId) {
//       if (workspaceId === '000000') {
//         query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
//       } else {
//         query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
//       }
//     }

//   const results = await query.getRawMany();

//   return results.map(r => ({
//     id: r.id,
//     name: r.name || 'Unknown Report',
//     workspaceId: r.workspaceId
//   }));
// }




// async getTopReports(startDate: Date, endDate: Date, limit: number = 10, workspaceId?: string): Promise<{reportId: string, reportName: string, count: number}[]> {
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select("log.reportId", "reportId")
//     .addSelect("log.reportName", "reportName")
//     .addSelect("COUNT(*)", "count")
//     .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere("log.reportId IS NOT NULL");

//     if (workspaceId && workspaceId !== 'all') {
//       if (workspaceId === '000000') {
//         // Special case for PersonalWorkspace
//         query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
//       } else {
//         // Normal case for regular workspaces
//         query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
//       }
//     }

//   const results = await query
//     .groupBy("log.reportId, log.reportName")
//     .orderBy("COUNT(*)", "DESC")
//     .limit(limit)
//     .getRawMany();

//   return results.map(r => ({
//     reportId: r.reportId,
//     reportName: r.reportName || 'Unknown Report',
//     count: parseInt(r.count)
//   }));
// }

async getTopUsers(startDate: Date, endDate: Date, limit: number = 10, workspaceId?: string, reportId?: string): Promise<{userId: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select("log.userId", "userId")
    .addSelect("COUNT(*)", "count")
    .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'");

    if (workspaceId && workspaceId !== 'all') {
      if (workspaceId === '000000') {
        // Special case for PersonalWorkspace
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        // Normal case for regular workspaces
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

  if (reportId) {
    query.andWhere("log.reportId = :reportId", { reportId });
  }

  const results = await query
    .groupBy("log.userId")
    .orderBy("COUNT(*)", "DESC")
    .limit(limit)
    .getRawMany();

  return results.map(r => ({
    userId: r.userId,
    count: parseInt(r.count)
  }));
}

async getUserConsumptionMethods(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ method: string; count: number }[]> {
  // First, let's get all raw data without filtering by operation
  const allLogs = await this.powerbiLogRepository.find({
    where: {
      userId,
      creationTime: Between(startDate, endDate),
    },
    select: ['consumptionMethod', 'operation'],
  });


  // Now filter for ViewReport operation
  const logs = allLogs.filter(log => log.operation === 'ViewReport');
  

  
  // Let's examine each null-like value differently
  const strictNulls = logs.filter(log => log.consumptionMethod === null);
  const undefinedValues = logs.filter(log => log.consumptionMethod === undefined);
  const emptyStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === '');
  const blankStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '' && log.consumptionMethod !== '');
  const nullStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === 'NULL');
  
  // console.log('Strict null values:', strictNulls.length);
  // console.log('Undefined values:', undefinedValues.length);
  // console.log('Empty strings:', emptyStrings.length);
  // console.log('Blank strings (whitespace):', blankStrings.length);
  // console.log('NULL string values:', nullStrings.length);

  // Maybe the null is stored differently in the database
  // Let's check for any unusual values
  const unusualValues = logs.filter(log => {
    const cm = log.consumptionMethod;
    return cm !== null && 
           typeof cm === 'string' && 
           cm !== '' && 
           cm !== 'NULL' && 
           !['Microsoft Teams', 'Power BI Web', 'Power BI Mobile', 'Export Report', 'PowerPoint add-in', 'Embedding for your organization'].includes(cm);
  });
  // console.log('Unusual values:', unusualValues.map(l => l.consumptionMethod));

  const methodCounts = new Map<string, number>();
  logs.forEach(log => {
    // Add extremely verbose condition to catch all possible null-like values
    if (log.consumptionMethod === null || 
        log.consumptionMethod === undefined ||
        log.consumptionMethod === 'NULL' ||
        log.consumptionMethod === 'null' || // Try lowercase null
        (typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '') ||
        (typeof log.consumptionMethod === 'object')) { // Catch any other strange object
      // console.log('Found null-like value:', log.consumptionMethod);
      methodCounts.set('Microsoft Teams', (methodCounts.get('Microsoft Teams') || 0) + 1);
    } else {
      methodCounts.set(log.consumptionMethod.trim(), (methodCounts.get(log.consumptionMethod.trim()) || 0) + 1);
    }
  });

  // console.log('Method counts after processing:', Array.from(methodCounts.entries()));
  // console.log('Microsoft Teams count:', methodCounts.get('Microsoft Teams') || 0);

  // Force add Microsoft Teams if it's missing and we know there are null values
  if ((strictNulls.length > 0 || undefinedValues.length > 0 || emptyStrings.length > 0 || 
       blankStrings.length > 0 || nullStrings.length > 0) && !methodCounts.has('Microsoft Teams')) {
    const nullLikeCount = strictNulls.length + undefinedValues.length + emptyStrings.length + 
                          blankStrings.length + nullStrings.length;
    // console.log(`Forcing Microsoft Teams with ${nullLikeCount} nulls`);
    methodCounts.set('Microsoft Teams', nullLikeCount);
  }

  return Array.from(methodCounts.entries()).map(([method, count]) => ({
    method,
    count,
  }));
}

async getUniqueUserCount(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<number> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('COUNT(DISTINCT log.userId)', 'count')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'");

    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }
  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const result = await query.getRawOne();
  return parseInt(result?.count || 0);
}

async getUniqueReportCount(startDate: Date, endDate: Date, workspaceId?: string): Promise<number> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('COUNT(DISTINCT log.reportId)', 'count')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.reportId IS NOT NULL');

    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

  const result = await query.getRawOne();
  return parseInt(result?.count || 0);
}

// async getUserMetrics(
//   userId: string, 
//   startDate: Date, 
//   endDate: Date,
//   workspaceId?: string,
//   reportId?: string
// ): Promise<{
//   totalViews: number;
//   reports: {reportId: string, reportName: string}[];
//   workspaces: {workspaceId: string, workspaceName: string}[];
//   activityByDate: {date: string, count: number}[];
// }> {
//   try {
//     const [totalViews, reports, workspaces, activityByDate] = await Promise.all([
//       this.getUserTotalViews(userId, startDate, endDate, workspaceId, reportId),
//       this.getUserReports(userId, startDate, endDate, workspaceId, reportId),
//       this.getUserWorkspaces(userId, startDate, endDate, reportId),
//       this.getUserActivityByDate(userId, startDate, endDate, workspaceId, reportId)
//     ]);

//     return {
//       totalViews: totalViews || 0,
//       reports: reports || [],
//       workspaces: workspaces || [],
//       activityByDate: activityByDate || []
//     };
//   } catch (error) {
//     // console.error('Error getting user metrics:', error);
//     return {
//       totalViews: 0,
//       reports: [],
//       workspaces: [],
//       activityByDate: []
//     };
//   }
// }

async getUserMetrics(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  workspaceId?: string,
  reportId?: string
): Promise<{
  totalViews: number;
  reports: {reportId: string, reportName: string}[];
  workspaces: {workspaceId: string, workspaceName: string}[];
  activityByDate: {date: string, count: number}[];
  assignedDashboards: string[];
  estimatedTimeSpent: number;
}> {
  try {
    const [totalViews, rawReports, rawWorkspaces, activityByDate, estimatedTimeSpent, userAssignments] = await Promise.all([
      this.getUserTotalViews(userId, startDate, endDate, workspaceId, reportId),
      this.getUserReports(userId, startDate, endDate, workspaceId, reportId),
      this.getUserWorkspaces(userId, startDate, endDate, reportId),
      this.getUserActivityByDate(userId, startDate, endDate, workspaceId, reportId),
      this.getUserEstimatedTimeSpent(userId, startDate, endDate, workspaceId, reportId),
      this.userDashboardRepository.find({
        where: { email: userId, isActive: true },
        relations: ['dashboard']
      })
    ]);

    // Map names for reports and workspaces
    const [reports, workspaces] = await Promise.all([
      Promise.all(rawReports.map(async r => ({
        reportId: r.reportId,
        reportName: await this.reportMappingService.getDisplayName(r.reportId, r.reportName)
      }))),
      Promise.all(rawWorkspaces.map(async w => ({
        workspaceId: w.workspaceId,
        workspaceName: await this.workspaceMappingService.getDisplayName(w.workspaceId, w.workspaceName)
      })))
    ]);

    return {
      totalViews: totalViews || 0,
      reports: reports || [],
      workspaces: workspaces || [],
      activityByDate: activityByDate || [],
      assignedDashboards: userAssignments.map(ua => ua.dashboard?.dashboard).filter(Boolean) || [],
      estimatedTimeSpent: estimatedTimeSpent || 0
    };
  } catch (error) {
    return {
      totalViews: 0,
      reports: [],
      workspaces: [],
      activityByDate: [],
      assignedDashboards: [],
      estimatedTimeSpent: 0
    };
  }
}

private async getUserEstimatedTimeSpent(
  userId: string,
  startDate: Date,
  endDate: Date,
  workspaceId?: string,
  reportId?: string
): Promise<number> {
  try {
    // 1. Try to get precise tracked duration from the custom tracking table first
    const preciseQuery = this.powerbiTimeSpentRepository
      .createQueryBuilder('spent')
      .select('SUM(spent.durationSeconds)', 'totalSeconds')
      .where('LOWER(spent.userId) = LOWER(:userId)', { userId })
      .andWhere('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (workspaceId) {
      preciseQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
    }
    if (reportId) {
      preciseQuery.andWhere('spent.reportId = :reportId', { reportId });
    }

    const preciseResult = await preciseQuery.getRawOne();
    const preciseSeconds = parseInt(preciseResult?.totalSeconds || '0', 10);

    if (preciseSeconds > 0) {
      return preciseSeconds;
    }

    // 2. Fall back to heuristic calculations if no precise telemetry exists yet
    const query = this.powerbiLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere("log.operation = 'ViewReport'")
      .orderBy('log.creationTime', 'ASC');

    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

    if (reportId) {
      query.andWhere('log.reportId = :reportId', { reportId });
    }

    const logs = await query.getMany();
    if (logs.length === 0) {
      return 0;
    }

    // Only accumulate real, measured gaps between consecutive events.
    // A gap exceeding 1 hour indicates the user left and returned — treat it as
    // a session boundary and skip it (no fabricated duration added).
    // The final event in each session contributes no duration since there is no
    // subsequent event to measure against.
    const MAX_SESSION_GAP_MS = 60 * 60 * 1000; // 1 hour

    let totalDurationSeconds = 0;

    for (let i = 0; i < logs.length - 1; i++) {
      const currentLogTime = new Date(logs[i].creationTime).getTime();
      const nextLogTime = new Date(logs[i + 1].creationTime).getTime();
      const diff = nextLogTime - currentLogTime;

      if (diff > 0 && diff <= MAX_SESSION_GAP_MS) {
        totalDurationSeconds += diff / 1000;
      }
      // Gaps beyond the session boundary are skipped — no fallback inserted.
    }

    return Math.round(totalDurationSeconds);
  } catch (error) {
    return 0;
  }
}
private async getUserTotalViews(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  workspaceId?: string,
  reportId?: string
): Promise<number> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.userId = :userId', { userId })
    .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'");

    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  return query.getCount();
}

private async getUserReports(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  workspaceId?: string,
  reportId?: string
) {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.reportId', 'reportId')
    .addSelect('log.reportName', 'reportName')
    .distinct(true)
    .where('log.userId = :userId', { userId })
    .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.reportId IS NOT NULL');

    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  return query.getRawMany().catch(() => []);
}

private async getUserWorkspaces(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  reportId?: string
) {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.workspaceId', 'workspaceId')
    .addSelect('log.workSpaceName', 'workspaceName')
    .distinct(true)
    .where('log.userId = :userId', { userId })
    .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.workspaceId IS NOT NULL');

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  return query.getRawMany().catch(() => []);
}

// async getUserActivityByDate(
//   userId: string, 
//   startDate: Date, 
//   endDate: Date,
//   workspaceId?: string,
//   reportId?: string
// ): Promise<{date: string, count: number}[]> {
//   // 1. Get raw data from DB with filters
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .where('log.userId = :userId', { userId })
//     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .select(['log.creationTime']);

//   if (workspaceId && workspaceId !== 'all') {
//     query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
//   }

//   if (reportId) {
//     query.andWhere('log.reportId = :reportId', { reportId });
//   }

//   const logs = await query.getMany();

//   // 2. Convert to Colombo time and count views per day
//   const dailyViews = new Map<string, number>(); // Date -> View count

//   logs.forEach(log => {
//     // Convert to Colombo time (UTC+5:30)
//     const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
//     const dateKey = colomboTime.toISOString().split('T')[0]; // YYYY-MM-DD

//     dailyViews.set(dateKey, (dailyViews.get(dateKey) || 0) + 1);
//   });

//   // 3. Convert to sorted array of {date, count}
//   return Array.from(dailyViews.entries())
//     .map(([date, count]) => ({
//       date,
//       count
//     }))
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
// }
async getUserActivityByDate(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  workspaceId?: string,
  reportId?: string
): Promise<{date: string, count: number}[]> {
  // 1. Get raw data from DB with filters
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.userId = :userId', { userId })
    .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .select(['log.creationTime']);

    if (workspaceId) {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const logs = await query.getMany();

  // 2. Count views per day in EDT timezone
  const dailyViews = new Map<string, number>(); // Date -> View count

  logs.forEach(log => {
    // Convert UTC date to EDT
    const utcDate = new Date(log.creationTime);
    
    // Options for converting to EDT
    const options = { timeZone: 'America/New_York' };
    
    // Format date in EDT timezone
    const edtDateString = utcDate.toLocaleDateString('en-US', options);
    const edtDateParts = edtDateString.split('/');
    
    // Format as YYYY-MM-DD
    const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;
    
    dailyViews.set(dateKey, (dailyViews.get(dateKey) || 0) + 1);
  });

  // 3. Convert to sorted array of {date, count}
  return Array.from(dailyViews.entries())
    .map(([date, count]) => ({
      date,
      count
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
// async getWorkspaceViewsDistribution(
//   userId: string, 
//   startDate: Date, 
//   endDate: Date,
//   reportId?: string
// ): Promise<{workspaceId: string, workspaceName: string, count: number}[]> {
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.workspaceId', 'workspaceId')
//     .addSelect('log.workSpaceName', 'workspaceName')
//     .addSelect('log.creationTime', 'creationTime')  // Add creation time for timezone conversion
//     .where('log.userId = :userId', { userId })
//     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.workspaceId IS NOT NULL');

//   if (reportId) {
//     query.andWhere('log.reportId = :reportId', { reportId });
//   }

//   const rawLogs = await query.getRawMany();
  
//   // Process using EDT timezone
//   const workspaceCounts = new Map<string, {workspaceId: string, workspaceName: string, count: number}>();
  
//   rawLogs.forEach(log => {
//     // Convert UTC date to EDT
//     const utcDate = new Date(log.creationTime);
    
//     // Options for converting to EDT
//     const options = { timeZone: 'America/New_York' };
    
//     // Format date in EDT timezone
//     const edtDateString = utcDate.toLocaleDateString('en-US', options);
//     const edtDateParts = edtDateString.split('/');
    
//     // Create a key for the workspace
//     const key = log.workspaceId;
    
//     if (!workspaceCounts.has(key)) {
//       workspaceCounts.set(key, {
//         workspaceId: log.workspaceId,
//         workspaceName: log.workspaceName || 'Unknown Workspace',
//         count: 0
//       });
//     }
    
//     // Increment count
//     workspaceCounts.get(key)!.count += 1;
//   });
  
//   // Convert to array and sort by count descending
//   return Array.from(workspaceCounts.values())
//     .sort((a, b) => b.count - a.count);
// }


async getWorkspaceViewsDistribution(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  reportId?: string
): Promise<{workspaceId: string, workspaceName: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.workspaceId', 'workspaceId')
    .addSelect('log.workSpaceName', 'originalName')
    .addSelect('log.creationTime', 'creationTime')
    .where('log.userId = :userId', { userId })
    .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.workspaceId IS NOT NULL');

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const rawLogs = await query.getRawMany();
  
  const workspaceCounts = new Map<string, {
    workspaceId: string, 
    workspaceName: string, 
    count: number
  }>();
  
  for (const log of rawLogs) {
    // Convert UTC date to EDT (existing time handling)
    const utcDate = new Date(log.creationTime);
    const options = { timeZone: 'America/New_York' };
    const edtDateString = utcDate.toLocaleDateString('en-US', options);
    const edtDateParts = edtDateString.split('/');
    
    // Get mapped workspace name
    const displayName = await this.workspaceMappingService.getDisplayName(
      log.workspaceId,
      log.originalName
    );

    if (!workspaceCounts.has(log.workspaceId)) {
      workspaceCounts.set(log.workspaceId, {
        workspaceId: log.workspaceId,
        workspaceName: displayName,
        count: 0
      });
    }
    
    workspaceCounts.get(log.workspaceId)!.count += 1;
  }
  
  return Array.from(workspaceCounts.values())
    .sort((a, b) => b.count - a.count);
}

private normalizeWorkspaceName(name: string | undefined): string {
  
  if (name.startsWith('PersonalWorkspace')) {
    return 'PersonalWorkspace';
  }
  
  return name;
}


async getUnusedReports(
  startDate: Date, 
  endDate: Date, 
  workspaceId?: string
): Promise<{id: number, dashboard: string, groupId: number | null}[]> {
  // Get all reports that have been viewed in the selected period
  const viewedReports = await this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.reportName', 'reportName')
    .addSelect('log.creationTime', 'creationTime')  // Include creationTime for timezone conversion
    .distinct(true)  // Use distinct(true) instead of putting DISTINCT in the select
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.reportName IS NOT NULL');

  if (workspaceId && workspaceId !== 'all') {
    viewedReports.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  const rawLogs = await viewedReports.getRawMany();
  

  const viewedReportNames = new Set<string>();
  
  rawLogs.forEach(log => {
    // Convert UTC date to EDT
    const utcDate = new Date(log.creationTime);
    
    // Options for converting to EDT
    const options = { timeZone: 'America/New_York' };
    
    // Format date in EDT timezone
    const edtDate = new Date(utcDate.toLocaleString('en-US', options));
    
    // Check if the EDT date is between startDate and endDate
    // Add report name to the set if it's valid and not empty
    if (log.reportName && log.reportName.trim() !== '') {
      viewedReportNames.add(log.reportName.toLowerCase().trim());
    }
  });

  // Convert set to array
  const viewedReportNamesArray = Array.from(viewedReportNames);
  
  // Get all dashboards from the database that aren't in the viewed reports list
  const query = this.dashboardRepository
    .createQueryBuilder('dashboard')
    .select(['dashboard.id', 'dashboard.dashboard', 'dashboard.groupId'])
    .where('dashboard.dashboard IS NOT NULL');

  if (viewedReportNamesArray.length > 0) {
    // Compare case-insensitive and trim whitespace
    query.andWhere('LOWER(TRIM(dashboard.dashboard)) NOT IN (:...viewedReportNames)', { 
      viewedReportNames: viewedReportNamesArray 
    });
  }

  return query.getMany();
}


// async getUserNameMappings(userEmails: string[]): Promise<{[email: string]: string}> {
//   if (!userEmails.length) return {};
  
//   const users = await this.userDashboardRepository
//     .createQueryBuilder('user')
//     .select(['user.email', 'user.userName'])
//     .where('user.email IN (:...emails)', { emails: userEmails })
//     .distinctOn(['user.email'])
//     .getRawMany();

//   const nameMap: {[email: string]: string} = {};
  
//   users.forEach(user => {
//     if (user.user_email && user.user_userName) {
//       nameMap[user.user_email] = user.user_userName;
//     }
//   });

//   return nameMap;
// }


async getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Promise<{id: string, name: string}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.workspaceId', 'id')
    .addSelect('log.workSpaceName', 'originalName')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.workspaceId IS NOT NULL')
    .distinct(true);

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const results = await query.getRawMany();

  // Process with workspace mapping
  const workspaceMap = new Map<string, {id: string, name: string}>();
  
  for (const result of results) {
    const workspaceId = result.id;
    const originalName = result.originalName;
    
    // Handle PersonalWorkspace specially
    if (originalName === 'PersonalWorkspace') {
      workspaceMap.set('PersonalWorkspace', {
        id: '000000',
        name: 'Personal Workspace'
      });
      continue;
    }

    // Get display name from mapping service
    const displayName = await this.workspaceMappingService.getDisplayName(
      workspaceId, 
      originalName
    );

    workspaceMap.set(workspaceId, {
      id: workspaceId,
      name: displayName
    });
  }
  
  return Array.from(workspaceMap.values());
}

// Update the getDistinctReports method
async getDistinctReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{id: string, name: string, workspaceId: string}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.reportId', 'id')
    .addSelect('log.reportName', 'originalName')
    .addSelect('log.workspaceId', 'workspaceId')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.reportId IS NOT NULL')
    .distinct(true);

  if (workspaceId) {
    if (workspaceId === '000000') {
      query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
    } else {
      query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
    }
  }

  const results = await query.getRawMany();

  // Process with report mapping
  const reports = [];
  for (const result of results) {
    const displayName = await this.reportMappingService.getDisplayName(
      result.id,
      result.originalName
    );

    reports.push({
      id: result.id,
      name: displayName,
      workspaceId: result.workspaceId
    });
  }

  return reports;
}

// Update the getTopReports method
async getTopReports(startDate: Date, endDate: Date, limit: number = 10, workspaceId?: string): Promise<{reportId: string, reportName: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select("log.reportId", "reportId")
    .addSelect("log.reportName", "originalName")
    .addSelect("COUNT(*)", "count")
    .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere("log.reportId IS NOT NULL");

    if (workspaceId && workspaceId !== 'all') {
      if (workspaceId === '000000') {
        query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
      } else {
        query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
      }
    }

  const results = await query
    .groupBy("log.reportId, log.reportName")
    .orderBy("COUNT(*)", "DESC")
    .limit(limit)
    .getRawMany();

  // Process with report mapping
  const mappedResults = [];
  for (const result of results) {
    const displayName = await this.reportMappingService.getDisplayName(
      result.reportId,
      result.originalName
    );

    mappedResults.push({
      reportId: result.reportId,
      reportName: displayName,
      count: parseInt(result.count)
    });
  }

  return mappedResults;
}



// async getUserCounts(
//   startDate: Date, 
//   endDate: Date,
//   workspaceId?: string,
//   reportId?: string
// ): Promise<{
//   totalUsers: number;
//   totalViews: number;
//   zeroViewUsers: number;
//   lowActivityUsers: number;
// }> {
//   // Get all permitted users based on filters
//   let workspaceName: string | undefined;
//   let reportName: string | undefined;
  
//   if (workspaceId && workspaceId !== 'all') {
//     workspaceName = await this.workspaceMappingService.getDisplayName(workspaceId);
//   }
  
//   if (reportId) {
//     reportName = await this.reportMappingService.getDisplayName(reportId);
//   }
  
//   const permittedUsers = await this.userDashboardService.getPermittedUsers(workspaceName, reportName);
//   const totalUsers = permittedUsers.length;

  
//   // Get active users from Power BI logs with view counts
//   const query = this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.userId', 'userId')
//     .addSelect('COUNT(*)', 'count')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .groupBy('log.userId');

//   if (workspaceId && workspaceId !== 'all') {
//     if (workspaceId === '000000') {
//       query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
//     } else {
//       query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
//     }
//   }

//   if (reportId) {
//     query.andWhere('log.reportId = :reportId', { reportId });
//   }

//   const activeUsers = await query.getRawMany();

//   // Calculate metrics
//   const totalViews = activeUsers.reduce((sum, user) => sum + parseInt(user.count), 0);
  
//   // Get users with zero views (permitted but not in active users)
//   const activeUserIds = activeUsers.map(u => u.userId);
//   const zeroViewUsers = permittedUsers.filter(email => !activeUserIds.includes(email)).length;
  
//   // Get users with less than 5 views
//   const lowActivityUsers = activeUsers.filter(u => parseInt(u.count) < 5).length;

//   return {
//     totalUsers,
//     totalViews,
//     zeroViewUsers,
//     lowActivityUsers
//   };
// }
async getUserCounts(
  startDate: Date, 
  endDate: Date,
  workspaceId?: string,
  reportId?: string
): Promise<{
  totalUsers: number;
  totalViews: number;
  zeroViewUsers: number;
  lowActivityUsers: number;
  deactivatedUsers: number;
  lastDeactivatedUsers: {email: string, name: string, department: string, deactivatedAt: Date}[];
}> {
  // Get all permitted users based on filters
  let workspaceName: string | undefined;
  let reportName: string | undefined;
  
  if (workspaceId && workspaceId !== 'all') {
    workspaceName = await this.workspaceMappingService.getDisplayName(workspaceId);
  }
  
  if (reportId) {
    reportName = await this.reportMappingService.getDisplayName(reportId);
  }
  
  const permittedUsers = await this.userDashboardService.getPermittedUsers(workspaceName, reportName);
  const totalUsers = permittedUsers.length;

  // Get active users from Power BI logs with view counts
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.userId', 'userId')
    .addSelect('COUNT(*)', 'count')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .groupBy('log.userId');

  if (workspaceId && workspaceId !== 'all') {
    if (workspaceId === '000000') {
      query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
    } else {
      query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
    }
  }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const activeUsers = await query.getRawMany();

  // Calculate metrics
  const totalViews = activeUsers.reduce((sum, user) => sum + parseInt(user.count), 0);
  
  // Get users with zero views (permitted but not in active users)
  const activeUserIds = activeUsers.map(u => u.userId);
  const zeroViewUsers = permittedUsers.filter(email => !activeUserIds.includes(email)).length;
  
  // Get users with less than 5 views
  const lowActivityUsers = activeUsers.filter(u => parseInt(u.count) < 5).length;

  // Get last deactivated users
  const deactivatedUsers = await this.userDashboardService.getLastDeactivatedUsers(5);
  
  // Get name mappings for deactivated users
  const userEmails = deactivatedUsers.map(u => u.email);
  let nameMappings: { [key: string]: string } = {};
  
  if (userEmails.length > 0) {
    try {
      const nameResponse = await this.getUserNameMappings(userEmails);
      nameMappings = nameResponse?.names || {};
    } catch (error) {
      // Handle error gracefully, use default names
      console.warn('Failed to get name mappings:', error);
    }
  }

  return {
    totalUsers,
    totalViews,
    zeroViewUsers,
    lowActivityUsers,
    deactivatedUsers: deactivatedUsers.length,
    lastDeactivatedUsers: deactivatedUsers.map(u => ({
      email: u.email,
      name: nameMappings[u.email] || u.email.split('@')[0],
      department: u.department || 'Unknown',
      deactivatedAt: u.lastActiveAt
    }))
  };
}
async getUserNameMappings(emails: string[]): Promise<{
  names: { [email: string]: string };
  departments: { [email: string]: string };
}> {
  if (!emails || emails.length === 0) {
    return {
      names: {},
      departments: {}
    };
  }

  const users = await this.userDashboardRepository
    .createQueryBuilder('user')
    .where('user.email IN (:...emails)', { emails })
    .select(['user.email', 'user.userName', 'user.department'])
    .getRawMany();

  const nameMap: { [email: string]: string } = {};
  const departmentMap: { [email: string]: string } = {};

  users.forEach(user => {
    if (user.user_email) {
      nameMap[user.user_email] = user.user_userName || user.user_email.split('@')[0];
      departmentMap[user.user_email] = user.user_department || 'Unknown';
    }
  });

  return {
    names: nameMap,
    departments: departmentMap,
  };
}

public async syncMappingsToMasterData(): Promise<void> {
  try {
    this.logger.log('Starting Workspace/Dashboard mappings to Master Data sync...');
    const manager = this.dashboardRepository.manager;

    // 1. Fetch workspace mappings and report mappings
    const workspaceMappings = await manager.query('SELECT * FROM workspace_mapping');
    const reportMappings = await manager.query('SELECT * FROM report_mapping');

    // 2. Sync workspaces
    const workspaceNameToId: { [name: string]: number } = {};
    for (const wm of workspaceMappings) {
      const name = (wm.displayName || wm.originalName || '').trim();
      if (!name) continue;
      // Check if exists case-insensitively
      const existing = await manager.query('SELECT id FROM workspace WHERE LOWER(workspace) = LOWER($1)', [name]);
      let workspaceId: number;
      if (existing && existing.length > 0) {
        workspaceId = existing[0].id;
      } else {
        try {
          const insertRes = await manager.query(
            'INSERT INTO workspace (workspace) VALUES ($1) ON CONFLICT (workspace) DO UPDATE SET workspace = EXCLUDED.workspace RETURNING id',
            [name]
          );
          workspaceId = insertRes[0].id;
        } catch (insertErr) {
          const fallback = await manager.query('SELECT id FROM workspace WHERE LOWER(workspace) = LOWER($1)', [name]);
          workspaceId = fallback[0]?.id;
        }
      }
      workspaceNameToId[wm.workspaceId] = workspaceId;
    }

    // 3. Sync dashboards & workspace links
    for (const rm of reportMappings) {
      const name = (rm.displayName || rm.originalName || '').trim();
      if (!name) continue;
      // Check if exists case-insensitively
      const existingDashboard = await manager.query('SELECT id FROM dashboard WHERE LOWER(dashboard) = LOWER($1)', [name]);
      let dashboardId: number;
      if (existingDashboard && existingDashboard.length > 0) {
        dashboardId = existingDashboard[0].id;
      } else {
        try {
          const insertRes = await manager.query(
            'INSERT INTO dashboard (dashboard, "groupId") VALUES ($1, NULL) ON CONFLICT (dashboard) DO UPDATE SET dashboard = EXCLUDED.dashboard RETURNING id',
            [name]
          );
          dashboardId = insertRes[0].id;
        } catch (insertErr) {
          const fallback = await manager.query('SELECT id FROM dashboard WHERE LOWER(dashboard) = LOWER($1)', [name]);
          dashboardId = fallback[0]?.id;
        }
      }

      // Link in dashboard_workspace
      const dbWorkspaceId = workspaceNameToId[rm.workspaceId];
      if (dbWorkspaceId && dashboardId) {
        const existingLink = await manager.query(
          'SELECT id FROM dashboard_workspace WHERE "workspaceId" = $1 AND "dashboardId" = $2',
          [dbWorkspaceId, dashboardId]
        );
        if (!existingLink || existingLink.length === 0) {
          await manager.query(
            'INSERT INTO dashboard_workspace ("workspaceId", "dashboardId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [dbWorkspaceId, dashboardId]
          );
        }
      }
    }

    this.logger.log('Workspace/Dashboard mappings successfully synced to Master Data.');
  } catch (err) {
    this.logger.error('Failed to sync mappings to Master Data', err.stack);
  }
}

public async syncUsersFromLogs(): Promise<void> {
  try {
    this.logger.log('Starting User roster sync from Power BI logs...');
    const manager = this.dashboardRepository.manager;

    // 1. Get distinct UserIds (emails) from power_bi_log
    const res = await manager.query('SELECT DISTINCT "userId" FROM power_bi_log WHERE "userId" IS NOT NULL');
    const emails = res.map(r => r.userId.toLowerCase());

    if (emails.length === 0) return;

    // 2. Get the 'Viewer' role (or create it)
    let roleRes = await manager.query("SELECT id FROM role_master WHERE role = 'Viewer'");
    let viewerRoleId;
    if (roleRes.length > 0) {
      viewerRoleId = roleRes[0].id;
    } else {
      const insertRole = await manager.query("INSERT INTO role_master (role) VALUES ('Viewer') RETURNING id");
      viewerRoleId = insertRole[0].id;
    }

 
    let newUsersCount = 0;
    for (const email of emails) {
      const userRes = await manager.query('SELECT id FROM "user" WHERE email = $1', [email]);
      if (userRes.length === 0) {
        const name = email.split('@')[0];
        const insertUser = await manager.query(
          'INSERT INTO "user" (email, name, is_active) VALUES ($1, $2, true) RETURNING id',
          [email, name]
        );
        const userId = insertUser[0].id;

        // Assign 'Viewer' role
        await manager.query(
          'INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)',
          [userId, viewerRoleId]
        );
        newUsersCount++;
      }
    }
    
    this.logger.log(`User roster sync complete. Added ${newUsersCount} new users from logs.`);
  } catch (err) {
    this.logger.error('Failed to sync users from logs', err.stack);
  }
}

public async saveTimeSpent(data: {
  userId: string;
  reportId: string;
  reportName: string;
  workspaceId?: string;
  workspaceName?: string;
  tabName: string;
  durationSeconds: number;
}): Promise<PowerBITimeSpent> {
  const entity = this.powerbiTimeSpentRepository.create({
    userId: data.userId.toLowerCase(),
    reportId: data.reportId,
    reportName: data.reportName,
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName,
    tabName: data.tabName,
    durationSeconds: data.durationSeconds,
    timestamp: new Date()
  });
  return this.powerbiTimeSpentRepository.save(entity);
}

public async getUserTimeSpentDistribution(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const query = this.powerbiTimeSpentRepository
    .createQueryBuilder('spent')
    .select('spent.reportId', 'reportId')
    .addSelect('spent.reportName', 'reportName')
    .addSelect('spent.workspaceId', 'workspaceId')
    .addSelect('spent.workspaceName', 'workspaceName')
    .addSelect('spent.tabName', 'tabName')
    .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
    .where('LOWER(spent.userId) = LOWER(:userId)', { userId })
    .andWhere('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
    .groupBy('spent.reportId, spent.reportName, spent.workspaceId, spent.workspaceName, spent.tabName')
    .orderBy('SUM(spent.durationSeconds)', 'DESC');

  const results = await query.getRawMany();

  // No fallback with fabricated durations — if the time-spent table has no
  // data yet for this user/period, return an empty array so the UI shows
  // real zeroes rather than invented numbers.
  if (results.length === 0) {
    return [];
  }

  return results.map(r => ({
    reportId: r.reportId,
    reportName: r.reportName || 'Unknown Report',
    workspaceId: r.workspaceId || 'Unknown',
    workspaceName: r.workspaceName || 'Personal Workspace',
    tabName: r.tabName || 'Overview',
    totalSeconds: parseInt(r.totalSeconds || '0', 10)
  }));
}

public async getTotalTimeSpentForUser(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const query = this.powerbiTimeSpentRepository
    .createQueryBuilder('spent')
    .select('SUM(spent.durationSeconds)', 'totalSeconds')
    .where('LOWER(spent.userId) = LOWER(:userId)', { userId })
    .andWhere('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

  const result = await query.getRawOne();
  return parseInt(result?.totalSeconds || '0', 10);
}

public async getLastRefreshTime(): Promise<{ lastRefreshedAt: Date }> {
  try {
    const latestLog = await this.powerbiLogRepository.findOne({
      where: {},
      order: { storedAt: 'DESC' }
    });
    return { lastRefreshedAt: latestLog ? latestLog.storedAt : new Date() };
  } catch (e) {
    return { lastRefreshedAt: new Date() };
  }
}

async getDashboardUsage(
  dashboardName: string,
  workspaceId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{
  totalViews: number;
  uniqueViewers: number;
  viewers: { userId: string; views: number; lastSeen: string; reports: string[] }[];
  topReports: { reportId: string; reportName: string; views: number; uniqueViewers: number }[];
  pageTimeBreakdown: { tabName: string; totalSeconds: number; uniqueUsers: number }[];
}> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere(
      "(LOWER(log.reportName) LIKE LOWER(:name) OR LOWER(log.artifactName) LIKE LOWER(:name) OR LOWER(log.itemName) LIKE LOWER(:name))",
      { name: `%${dashboardName.trim()}%` }
    );

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  const logs = await query.getMany();

  const userMap = new Map<string, { userId: string; views: number; lastSeen: string; reports: Set<string> }>();
  const reportMap = new Map<string, { reportId: string; reportName: string; views: number; viewerSet: Set<string> }>();

  logs.forEach(log => {
    if (!userMap.has(log.userId)) {
      userMap.set(log.userId, { userId: log.userId, views: 0, lastSeen: log.creationTime.toISOString(), reports: new Set() });
    }
    const user = userMap.get(log.userId)!;
    user.views++;
    if (log.reportName) user.reports.add(log.reportName);
    if (log.creationTime.toISOString() > user.lastSeen) user.lastSeen = log.creationTime.toISOString();

    if (log.reportId) {
      if (!reportMap.has(log.reportId)) {
        reportMap.set(log.reportId, { reportId: log.reportId, reportName: log.reportName || 'Unknown', views: 0, viewerSet: new Set() });
      }
      const report = reportMap.get(log.reportId)!;
      report.views++;
      report.viewerSet.add(log.userId);
    }
  });
 
  const pageQuery = this.powerbiTimeSpentRepository
    .createQueryBuilder('spent')
    .select('spent.tabName', 'tabName')
    .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
    .addSelect('COUNT(DISTINCT spent.userId)', 'uniqueUsers')
    .where('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere('LOWER(spent.reportName) LIKE LOWER(:name)', { name: `%${dashboardName.trim()}%` })
    .groupBy('spent.tabName')
    .orderBy('SUM(spent.durationSeconds)', 'DESC');

  if (workspaceId && workspaceId !== 'all') {
    pageQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
  }

  const pageRows = await pageQuery.getRawMany();

  const viewers = Array.from(userMap.values())
    .map(u => ({ userId: u.userId, views: u.views, lastSeen: u.lastSeen, reports: Array.from(u.reports) }))
    .sort((a, b) => b.views - a.views);

  const topReports = Array.from(reportMap.values())
    .map(r => ({ reportId: r.reportId, reportName: r.reportName, views: r.views, uniqueViewers: r.viewerSet.size }))
    .sort((a, b) => b.views - a.views);

  const pageTimeBreakdown = pageRows.map(r => ({
    tabName: r.tabName || 'Main Page',
    totalSeconds: parseInt(r.totalSeconds || '0'),
    uniqueUsers: parseInt(r.uniqueUsers || '0')
  }));

  return { totalViews: logs.length, uniqueViewers: userMap.size, viewers, topReports, pageTimeBreakdown };
}

async getTimeSpentOverview(
  startDate: Date,
  endDate: Date,
  workspaceId?: string
): Promise<{
  topUsersByTime: { userId: string; totalSeconds: number }[];
  topReportsByTime: { reportId: string; reportName: string; totalSeconds: number }[];
}> {
  const userTimeQuery = this.powerbiTimeSpentRepository
    .createQueryBuilder('spent')
    .select('spent.userId', 'userId')
    .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
    .where('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
    .groupBy('spent.userId')
    .orderBy('SUM(spent.durationSeconds)', 'DESC')
    .limit(10);

  const reportTimeQuery = this.powerbiTimeSpentRepository
    .createQueryBuilder('spent')
    .select('spent.reportId', 'reportId')
    .addSelect('spent.reportName', 'reportName')
    .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
    .where('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
    .groupBy('spent.reportId, spent.reportName')
    .orderBy('SUM(spent.durationSeconds)', 'DESC')
    .limit(10);

  if (workspaceId && workspaceId !== 'all') {
    userTimeQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
    reportTimeQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
  }

  const [userResults, reportResults] = await Promise.all([
    userTimeQuery.getRawMany(),
    reportTimeQuery.getRawMany()
  ]);

  if (userResults.length > 0 || reportResults.length > 0) {
    return {
      topUsersByTime: userResults.map(r => ({ userId: r.userId, totalSeconds: parseInt(r.totalSeconds || '0') })),
      topReportsByTime: reportResults.map(r => ({ reportId: r.reportId, reportName: r.reportName || 'Unknown', totalSeconds: parseInt(r.totalSeconds || '0') }))
    };
  }

  // Fallback: estimate from powerbi_log (2 min per view)
  const logQuery = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'");

  if (workspaceId && workspaceId !== 'all') {
    if (workspaceId === '000000') {
      logQuery.andWhere("log.workSpaceName = 'PersonalWorkspace'");
    } else {
      logQuery.andWhere("log.workspaceId = :workspaceId", { workspaceId });
    }
  }

  const logs = await logQuery.getMany();

  const userTimeMap = new Map<string, number>();
  const reportTimeMap = new Map<string, { reportId: string; reportName: string; totalSeconds: number }>();

  logs.forEach(log => {
    userTimeMap.set(log.userId, (userTimeMap.get(log.userId) || 0) + 120);
    if (log.reportId) {
      if (!reportTimeMap.has(log.reportId)) {
        reportTimeMap.set(log.reportId, { reportId: log.reportId, reportName: log.reportName || 'Unknown', totalSeconds: 0 });
      }
      reportTimeMap.get(log.reportId)!.totalSeconds += 120;
    }
  });

  return {
    topUsersByTime: Array.from(userTimeMap.entries())
      .map(([userId, totalSeconds]) => ({ userId, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 10),
    topReportsByTime: Array.from(reportTimeMap.values())
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 10)
  };
}
}