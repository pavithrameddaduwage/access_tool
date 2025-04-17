// src/powerbi-metrics/powerbi-metrics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, from, forkJoin } from 'rxjs';
import { map, mergeMap, reduce, tap } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios'; 
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { PowerBILog } from './entities/powerbi-log.entity';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';
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
    private readonly powerbiLogRepository: Repository<PowerBILog>
  ) {}
  

  private readonly logger = new Logger(PowerBIMetricsService.name);
  public async getAccessToken(): Promise<string> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');
    
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'https://manage.office.com/.default');
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');
    
    const response = await this.httpService.post(tokenEndpoint, params).toPromise();
    return response.data.access_token;
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
      console.warn('Subscription check completed with warnings:', {
        status: error.response?.status,
        code: error.response?.data?.error?.code,
        message: error.response?.data?.error?.message || error.message
      });
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
    const allLogEntries = await this.getAllLogEntries(startDate, endDate);
    
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
    const allLogEntries = await this.getAllLogEntries(startDate, endDate); // Get the log entries
    
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

  public processLogEntries(entries: PowerBILogEntry[]): PowerBIMetrics {
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
    
    // Populate the maps
    entries.forEach(entry => {
      // Only count view operations
      if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
        // Update workspace metrics
        if (entry.WorkspaceId) {
          if (!workspacesMap.has(entry.WorkspaceId)) {
            workspacesMap.set(entry.WorkspaceId, {
              id: entry.WorkspaceId,
              name: entry.WorkSpaceName || 'Unknown',
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
          if (!reportsMap.has(entry.ReportId)) {
            reportsMap.set(entry.ReportId, {
              id: entry.ReportId,
              name: entry.ReportName || entry.ArtifactName || 'Unknown',
              workspaceId: entry.WorkspaceId || 'Unknown',
              workspaceName: entry.WorkSpaceName || 'Unknown',
              views: 0,
              viewerSet: new Set<string>()
            });
          }
          
          const report = reportsMap.get(entry.ReportId);
          report.views += 1;
          report.viewerSet.add(entry.UserId);
        }
      }
    });
    
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


  // async getPowerBIMetrics(startDate: Date, endDate: Date): Promise<PowerBIMetrics> {
  //   // First try to get from database (historical data)
  //   const dbLogs = await this.getLogsFromDatabase(startDate, endDate);
    
  //   if (dbLogs.length > 0) {
  //     return this.processLogEntries(dbLogs);
  //   }
    
  //   // Fallback to API if no historical data available
  //   try {
  //     const accessToken = await this.getAccessToken();
  //     await this.ensureSubscription(accessToken);
  //     const contentUris = await this.getContentUris(accessToken, startDate, endDate);
      
  //     const batchSize = 3;
  //     const allLogEntries: PowerBILogEntry[] = [];
      
  //     for (let i = 0; i < contentUris.length; i += batchSize) {
  //       const batch = contentUris.slice(i, i + batchSize);
  //       const batchResults = await Promise.all(
  //         batch.map(uri => 
  //           this.getLogEntries(uri, accessToken)
  //             .catch(e => {
  //               console.warn(`Failed to process ${uri}`, e.message);
  //               return [];
  //             })
  //         )
  //       );
  //       allLogEntries.push(...batchResults.flat());
  //     }

  //     return this.processLogEntries(allLogEntries.filter(Boolean));
  //   } catch (error) {
  //     console.error('Critical error:', error);
  //     return this.emptyMetricsResponse();
  //   }
  // }
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
    const entities = logs.map(log => this.powerbiLogRepository.create({
      id: log.Id,
      recordType: log.RecordType,
      creationTime: new Date(log.CreationTime),
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
      workSpaceName: log.WorkSpaceName,
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
    }));
  
    await this.powerbiLogRepository.save(entities);
  }
  private async getLogsFromDatabase(startDate: Date, endDate: Date): Promise<PowerBILogEntry[]> {
    const logs = await this.powerbiLogRepository.find({
      where: {
        creationTime: Between(startDate, endDate),
        workload: 'PowerBI',
        operation: 'ViewReport',
      },
      order: {
        creationTime: 'ASC',
      },
    });
  
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
      console.error(`Failed to process ${contentUri}:`, error.message);
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

// async getUniqueUserCount(startDate: Date, endDate: Date): Promise<number> {
//   const result = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('COUNT(DISTINCT log.userId)', 'count')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .getRawOne();

//   return parseInt(result?.count || 0);
// }

// async getUniqueReportCount(startDate: Date, endDate: Date): Promise<number> {
//   const result = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('COUNT(DISTINCT log.reportId)', 'count')
//     .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.reportId IS NOT NULL')
//     .getRawOne();

//   return parseInt(result?.count || 0);
// }

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


// async getViewCountsByDate(startDate: Date, endDate: Date): Promise<{date: string, count: number}[]> {
//   const results = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select("DATE(log.creationTime)", "date")
//     .addSelect("COUNT(*)", "count")
//     .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .groupBy("DATE(log.creationTime)")
//     .orderBy("DATE(log.creationTime)", "ASC")
//     .getRawMany();

//   return results.map(r => ({
//     date: r.date,
//     count: parseInt(r.count)
//   }));
// }
// async getViewCountsByDate(startDate: Date, endDate: Date): Promise<{date: string, count: number}[]> {
//   // 1. Get raw UTC data from DB
//   const logs = await this.powerbiLogRepository.find({
//     where: {
//       creationTime: Between(startDate, endDate),
//       operation: 'ViewReport'
//     },
//     select: ['creationTime']
//   });

//   // 2. Convert to Colombo time (UTC+5:30) and count
//   const counts = new Map<string, number>();
  
//   logs.forEach(log => {
//     // Convert UTC to Colombo time (add 5h 30m)
//     const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
//     const dateKey = colomboTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
//     counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
//   });

//   // 3. Return sorted results
//   return Array.from(counts.entries())
//     .map(([date, count]) => ({ date, count }))
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
// }

// async getTopReports(startDate: Date, endDate: Date, limit: number = 10): Promise<{reportId: string, reportName: string, count: number}[]> {
//   const results = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select("log.reportId", "reportId")
//     .addSelect("log.reportName", "reportName")
//     .addSelect("COUNT(*)", "count")
//     .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere("log.reportId IS NOT NULL")
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

// async getTopUsers(startDate: Date, endDate: Date, limit: number = 10): Promise<{userId: string, count: number}[]> {
//   const results = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select("log.userId", "userId")
//     .addSelect("COUNT(*)", "count")
//     .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .groupBy("log.userId")
//     .orderBy("COUNT(*)", "DESC")
//     .limit(limit)
//     .getRawMany();

//   return results.map(r => ({
//     userId: r.userId,
//     count: parseInt(r.count)
//   }));
// }

// async getUserActivityTrend(startDate: Date, endDate: Date): Promise<{date: string, count: number}[]> {
//   // 1. Get raw data from DB (all view events)
//   const logs = await this.powerbiLogRepository.find({
//     where: {
//       creationTime: Between(startDate, endDate),
//       operation: 'ViewReport'
//     },
//     select: ['creationTime', 'userId']
//   });

//   // 2. Convert to Colombo time and count UNIQUE users per day
//   const dailyActiveUsers = new Map<string, Set<string>>(); // Date -> Set of user IDs

//   logs.forEach(log => {
//     // Convert to Colombo time (UTC+5:30)
//     const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
//     const dateKey = colomboTime.toISOString().split('T')[0]; // YYYY-MM-DD

//     // Initialize the Set if it doesn't exist
//     if (!dailyActiveUsers.has(dateKey)) {
//       dailyActiveUsers.set(dateKey, new Set());
//     }

//     // Add user to the Set (automatically handles uniqueness)
//     dailyActiveUsers.get(dateKey)?.add(log.userId);
//   });

//   // 3. Convert to sorted array of {date, count}
//   return Array.from(dailyActiveUsers.entries())
//     .map(([date, users]) => ({
//       date,
//       count: users.size // Number of unique users
//     }))
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
// }

// async getWorkspaceForReport(reportId: string): Promise<{workspaceId: string, workspaceName: string} | null> {
//   const result = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.workspaceId', 'workspaceId')
//     .addSelect('log.workSpaceName', 'workspaceName')
//     .where('log.reportId = :reportId', { reportId })
//     .andWhere('log.workspaceId IS NOT NULL')
//     .limit(1)
//     .getRawOne();

//   return result ? {
//     workspaceId: result.workspaceId,
//     workspaceName: result.workspaceName || 'Unknown Workspace'
//   } : null;
// }

// async getUserMetrics(userId: string, startDate: Date, endDate: Date): Promise<{
//   totalViews: number;
//   reports: {reportId: string, reportName: string}[];
//   workspaces: {workspaceId: string, workspaceName: string}[];
//   activityByDate: {date: string, count: number}[];
// }> {
//   try {
//     const [totalViews, reports, workspaces, activityByDate] = await Promise.all([
//       this.powerbiLogRepository.count({
//         where: {
//           userId,
//           creationTime: Between(startDate, endDate),
//           operation: 'ViewReport'
//         }
//       }),
//       this.getUserReports(userId, startDate, endDate),
//       this.getUserWorkspaces(userId, startDate, endDate),
//       this.getUserActivityByDate(userId, startDate, endDate)
//     ]);

//     return {
//       totalViews: totalViews || 0,
//       reports: reports || [],
//       workspaces: workspaces || [],
//       activityByDate: activityByDate || []
//     };
//   } catch (error) {
//     console.error('Error getting user metrics:', error);
//     return {
//       totalViews: 0,
//       reports: [],
//       workspaces: [],
//       activityByDate: []
//     };
//   }
// }

// private async getUserReports(userId: string, startDate: Date, endDate: Date) {
//   return this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.reportId', 'reportId')
//     .addSelect('log.reportName', 'reportName')
//     .distinct(true)
//     .where('log.userId = :userId', { userId })
//     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.reportId IS NOT NULL')
//     .getRawMany()
//     .catch(() => []);
// }

// private async getUserWorkspaces(userId: string, startDate: Date, endDate: Date) {
//   return this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.workspaceId', 'workspaceId')
//     .addSelect('log.workSpaceName', 'workspaceName')
//     .distinct(true)
//     .where('log.userId = :userId', { userId })
//     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.workspaceId IS NOT NULL')
//     .getRawMany()
//     .catch(() => []);
// }

// private async getUserActivityByDate(userId: string, startDate: Date, endDate: Date) {
//   return this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select("DATE(log.creationTime)", "date")
//     .addSelect("COUNT(*)", "count")
//     .where('log.userId = :userId', { userId })
//     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .groupBy("DATE(log.creationTime)")
//     .orderBy("DATE(log.creationTime)", "ASC")
//     .getRawMany()
//     .catch(() => []);
// }
// async getWorkspaceViewsDistribution(userId: string, startDate: Date, endDate: Date): Promise<{workspaceId: string, workspaceName: string, count: number}[]> {
//   const results = await this.powerbiLogRepository
//     .createQueryBuilder('log')
//     .select('log.workspaceId', 'workspaceId')
//     .addSelect('log.workSpaceName', 'workspaceName')
//     .addSelect('COUNT(*)', 'count')
//     .where('log.userId = :userId', { userId })
//     .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
//     .andWhere("log.operation = 'ViewReport'")
//     .andWhere('log.workspaceId IS NOT NULL')
//     .groupBy('log.workspaceId, log.workSpaceName')
//     .orderBy('COUNT(*)', 'DESC')
//     .getRawMany();

//   return results.map(r => ({
//     workspaceId: r.workspaceId,
//     workspaceName: r.workspaceName || 'Unknown Workspace',
//     count: parseInt(r.count)
//   }));
// }

async getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Promise<{id: string, name: string}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.workspaceId', 'id')
    .addSelect('log.workSpaceName', 'name')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.workspaceId IS NOT NULL')
    .distinct(true);

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const results = await query.getRawMany();

  return results.map(r => ({
    id: r.id,
    name: r.name || 'Unknown Workspace'
  }));
}
async getViewCountsByDate(
  startDate: Date, 
  endDate: Date, 
  workspaceId?: string, 
  reportId?: string
): Promise<{date: string, count: number}[]> {
  // 1. Get raw UTC data from DB with filters
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .select(['log.creationTime']);

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const logs = await query.getMany();

  // 2. Convert to Colombo time (UTC+5:30) and count
  const counts = new Map<string, number>();
  
  logs.forEach(log => {
    // Convert UTC to Colombo time (add 5h 30m)
    const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
    const dateKey = colomboTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
  });

  // 3. Return sorted results
  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}


async getUserActivityTrend(
  startDate: Date, 
  endDate: Date, 
  workspaceId?: string, 
  reportId?: string
): Promise<{date: string, count: number}[]> {
  // 1. Get raw data from DB (all view events) with filters
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .select(['log.creationTime', 'log.userId']);

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const logs = await query.getMany();

  // 2. Convert to Colombo time and count UNIQUE users per day
  const dailyActiveUsers = new Map<string, Set<string>>(); // Date -> Set of user IDs

  logs.forEach(log => {
    // Convert to Colombo time (UTC+5:30)
    const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
    const dateKey = colomboTime.toISOString().split('T')[0]; // YYYY-MM-DD

    // Initialize the Set if it doesn't exist
    if (!dailyActiveUsers.has(dateKey)) {
      dailyActiveUsers.set(dateKey, new Set());
    }

    // Add user to the Set (automatically handles uniqueness)
    dailyActiveUsers.get(dateKey)?.add(log.userId);
  });

  // 3. Convert to sorted array of {date, count}
  return Array.from(dailyActiveUsers.entries())
    .map(([date, users]) => ({
      date,
      count: users.size // Number of unique users
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
async getDistinctReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{id: string, name: string, workspaceId: string}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.reportId', 'id')
    .addSelect('log.reportName', 'name')
    .addSelect('log.workspaceId', 'workspaceId')
    .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.reportId IS NOT NULL')
    .distinct(true);

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  const results = await query.getRawMany();

  return results.map(r => ({
    id: r.id,
    name: r.name || 'Unknown Report',
    workspaceId: r.workspaceId
  }));
}




async getTopReports(startDate: Date, endDate: Date, limit: number = 10, workspaceId?: string): Promise<{reportId: string, reportName: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select("log.reportId", "reportId")
    .addSelect("log.reportName", "reportName")
    .addSelect("COUNT(*)", "count")
    .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere("log.reportId IS NOT NULL");

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
  }

  const results = await query
    .groupBy("log.reportId, log.reportName")
    .orderBy("COUNT(*)", "DESC")
    .limit(limit)
    .getRawMany();

  return results.map(r => ({
    reportId: r.reportId,
    reportName: r.reportName || 'Unknown Report',
    count: parseInt(r.count)
  }));
}

async getTopUsers(startDate: Date, endDate: Date, limit: number = 10, workspaceId?: string, reportId?: string): Promise<{userId: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select("log.userId", "userId")
    .addSelect("COUNT(*)", "count")
    .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'");

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
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

  console.log('All logs count:', allLogs.length);
  console.log('All operations:', [...new Set(allLogs.map(l => l.operation))]);
  
  // Now filter for ViewReport operation
  const logs = allLogs.filter(log => log.operation === 'ViewReport');
  
  console.log('ViewReport logs count:', logs.length);
  console.log('Raw consumption methods from DB:', logs.map(l => ({
    value: l.consumptionMethod,
    type: typeof l.consumptionMethod,
    isNull: l.consumptionMethod === null,
    isUndefined: l.consumptionMethod === undefined,
    isEmptyString: l.consumptionMethod === '',
    isNullString: l.consumptionMethod === 'NULL',
  })));
  
  // Let's examine each null-like value differently
  const strictNulls = logs.filter(log => log.consumptionMethod === null);
  const undefinedValues = logs.filter(log => log.consumptionMethod === undefined);
  const emptyStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === '');
  const blankStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '' && log.consumptionMethod !== '');
  const nullStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === 'NULL');
  
  console.log('Strict null values:', strictNulls.length);
  console.log('Undefined values:', undefinedValues.length);
  console.log('Empty strings:', emptyStrings.length);
  console.log('Blank strings (whitespace):', blankStrings.length);
  console.log('NULL string values:', nullStrings.length);

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
  console.log('Unusual values:', unusualValues.map(l => l.consumptionMethod));

  const methodCounts = new Map<string, number>();
  logs.forEach(log => {
    // Add extremely verbose condition to catch all possible null-like values
    if (log.consumptionMethod === null || 
        log.consumptionMethod === undefined ||
        log.consumptionMethod === 'NULL' ||
        log.consumptionMethod === 'null' || // Try lowercase null
        (typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '') ||
        (typeof log.consumptionMethod === 'object')) { // Catch any other strange object
      console.log('Found null-like value:', log.consumptionMethod);
      methodCounts.set('Microsoft Teams', (methodCounts.get('Microsoft Teams') || 0) + 1);
    } else {
      methodCounts.set(log.consumptionMethod.trim(), (methodCounts.get(log.consumptionMethod.trim()) || 0) + 1);
    }
  });

  console.log('Method counts after processing:', Array.from(methodCounts.entries()));
  console.log('Microsoft Teams count:', methodCounts.get('Microsoft Teams') || 0);

  // Force add Microsoft Teams if it's missing and we know there are null values
  if ((strictNulls.length > 0 || undefinedValues.length > 0 || emptyStrings.length > 0 || 
       blankStrings.length > 0 || nullStrings.length > 0) && !methodCounts.has('Microsoft Teams')) {
    const nullLikeCount = strictNulls.length + undefinedValues.length + emptyStrings.length + 
                          blankStrings.length + nullStrings.length;
    console.log(`Forcing Microsoft Teams with ${nullLikeCount} nulls`);
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

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
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

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  const result = await query.getRawOne();
  return parseInt(result?.count || 0);
}

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
}> {
  try {
    const [totalViews, reports, workspaces, activityByDate] = await Promise.all([
      this.getUserTotalViews(userId, startDate, endDate, workspaceId, reportId),
      this.getUserReports(userId, startDate, endDate, workspaceId, reportId),
      this.getUserWorkspaces(userId, startDate, endDate, reportId),
      this.getUserActivityByDate(userId, startDate, endDate, workspaceId, reportId)
    ]);

    return {
      totalViews: totalViews || 0,
      reports: reports || [],
      workspaces: workspaces || [],
      activityByDate: activityByDate || []
    };
  } catch (error) {
    console.error('Error getting user metrics:', error);
    return {
      totalViews: 0,
      reports: [],
      workspaces: [],
      activityByDate: []
    };
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

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
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

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
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

  if (workspaceId && workspaceId !== 'all') {
    query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
  }

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const logs = await query.getMany();

  // 2. Convert to Colombo time and count views per day
  const dailyViews = new Map<string, number>(); // Date -> View count

  logs.forEach(log => {
    // Convert to Colombo time (UTC+5:30)
    const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
    const dateKey = colomboTime.toISOString().split('T')[0]; // YYYY-MM-DD

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

async getWorkspaceViewsDistribution(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  reportId?: string
): Promise<{workspaceId: string, workspaceName: string, count: number}[]> {
  const query = this.powerbiLogRepository
    .createQueryBuilder('log')
    .select('log.workspaceId', 'workspaceId')
    .addSelect('log.workSpaceName', 'workspaceName')
    .addSelect('COUNT(*)', 'count')
    .where('log.userId = :userId', { userId })
    .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere("log.operation = 'ViewReport'")
    .andWhere('log.workspaceId IS NOT NULL');

  if (reportId) {
    query.andWhere('log.reportId = :reportId', { reportId });
  }

  const results = await query
    .groupBy('log.workspaceId, log.workSpaceName')
    .orderBy('COUNT(*)', 'DESC')
    .getRawMany();

  return results.map(r => ({
    workspaceId: r.workspaceId,
    workspaceName: r.workspaceName || 'Unknown Workspace',
    count: parseInt(r.count)
  }));
}






}