// powerbi-analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClientSecretCredential } from '@azure/identity';
import { UsageMetrics } from './models/usage-metrics.model';
import { firstValueFrom } from 'rxjs';
import { all } from 'axios';
import { PowerbiStorageService } from './powerbi-storage.service';

@Injectable()
export class PowerBIService {
  private readonly apiUrl = 'https://api.powerbi.com/v1.0/myorg';
  private credential: ClientSecretCredential;
  public readonly logger = new Logger(PowerBIService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly storageService: PowerbiStorageService,

    
  ) {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');

    this.logger.debug(`TenantID length: ${tenantId?.length}`);
    this.logger.debug(`ClientID length: ${clientId?.length}`);
    this.logger.debug(`ClientSecret length: ${clientSecret?.length}`);

    try {
      this.credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
      );
      this.logger.debug('Credential object created successfully');
    } catch (error) {
      this.logger.error('Failed to create credential object:', error.message);
      throw error;
    }
  }






  
 
  async getMyWorkspaceAccess() {
    try {
      const token = await this.getAccessToken();
      
      // Get all workspaces the service principal has access to
      const url = `${this.apiUrl}/groups?$filter=delegated eq true`;
      this.logger.debug(`Checking workspace access: ${url}`);
      
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.logger.debug(`Found ${response.data.value.length} accessible workspaces`);
      return response.data.value;
    } catch (error) {
      this.logger.error('Failed to check workspace access:', error.message);
      throw new Error(`Failed to check workspace access: ${error.message}`);
    }
  }


  public async getAccessToken(): Promise<string> {
    try {
      this.logger.debug('Attempting to get access token...');
      const token = await this.credential.getToken(
        'https://analysis.windows.net/powerbi/api/.default'
      );
      this.logger.debug(`Token starts with: ${token.token.substring(0, 10)}...`);
      this.logger.debug(`Token expires in: ${token.expiresOnTimestamp}`);
      return token.token;
    } catch (error) {
      this.logger.error('Failed to get access token:', error.message);
      throw error;
    }
  }
  
  async getWorkspaces() {
    try {
      this.logger.debug('Getting access token for workspaces request...');
      const token = await this.getAccessToken();
      
      this.logger.debug('Making request to Power BI API...');
      const url = `${this.apiUrl}/groups`;
      this.logger.debug(`Request URL: ${url}`);
      this.logger.debug('Request Headers:', {
        Authorization: `Bearer ${token.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      });
  
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.logger.debug('Successfully retrieved workspaces');
      return response.data.value;
    } catch (error) {
      if (error.response) {
        this.logger.error(`API Error Status: ${error.response.status}`);
        this.logger.error('API Error Data:', error.response.data);
        this.logger.error('API Response Headers:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        this.logger.error('No response received from API');
        this.logger.error(error.request);
      } else {
        this.logger.error('Error setting up request:', error.message);
      }
      throw new Error(`Failed to get workspaces: ${error.message}`);
    }
  }


  

  async getSpecificWorkspace(workspaceId: string) {
    try {
      const token = await this.getAccessToken();
      const url = `${this.apiUrl}/groups/${workspaceId}`;
      
      this.logger.debug(`Getting specific workspace: ${url}`);
      
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get workspace ${workspaceId}:`, error.message);
      throw new Error(`Failed to get workspace: ${error.message}`);
    }
  }

  async getData() {
    try {
      const token = await this.getAccessToken();
      const url = `${this.apiUrl}/admin/activityevents?startDateTime=2024-02-01T00:00:00Z&endDateTime=2024-02-21T00:00:00Z`;
      
      this.logger.debug(`Getting data for my workspaces`);
      
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get data for my workspaces:`, error.message);
      throw new Error(`Failed to get data: ${error.message}`);
    }
  }

  async getReports(workspaceId: string) {
    try {
      const token = await this.getAccessToken();
      const url = `${this.apiUrl}/groups/${workspaceId}/reports`;
      
      this.logger.debug(`Getting reports for workspace ${workspaceId}`);
      
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.value;
    } catch (error) {
      this.logger.error(`Failed to get reports for workspace ${workspaceId}:`, error.message);
      throw new Error(`Failed to get reports: ${error.message}`);
    }
  }

  async getAllWorkspaces() {
    try {
      const token = await this.getAccessToken();
      const url = `${this.apiUrl}/groups`;
      
      this.logger.debug(`Getting all accessible workspaces`);
      
      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.logger.debug(`Found ${response.data.value.length} workspaces`);
      return response.data.value;
    } catch (error) {
      this.logger.error('Failed to get workspaces:', error.message);
      throw new Error(`Failed to get workspaces: ${error.message}`);
    }
  }

  //NEW ONES




async getReportUsageMetrics(workspaceId: string, reportId: string) {
  try {
    const token = await this.getAccessToken();
    const url = `${this.apiUrl}/groups/${workspaceId}/reports/${reportId}/usage`;
    
    this.logger.debug(`Getting usage metrics for report ${reportId}`);
    
    const response = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    this.logger.error(`Failed to get usage metrics for report ${reportId}:`, error.message);
    throw new Error(`Failed to get report metrics: ${error.message}`);
  }
}

async getWorkspaceUsageMetrics(workspaceId: string) {
  try {
    const token = await this.getAccessToken();
    
    // First get all reports in the workspace
    const reportsUrl = `${this.apiUrl}/groups/${workspaceId}/reports`;
    const reportsResponse = await this.httpService.axiosRef.get(reportsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const reports = reportsResponse.data.value;
    this.logger.debug(`Found ${reports.length} reports in workspace ${workspaceId}`);
    
    // Get usage metrics for each report
    const metricsPromises = reports.map(report => 
      this.getReportUsageMetrics(workspaceId, report.id)
        .then(metrics => ({
          reportId: report.id,
          reportName: report.name,
          metrics
        }))
        .catch(error => ({
          reportId: report.id,
          reportName: report.name,
          metrics: { error: error.message }
        }))
    );
    
    const reportMetrics = await Promise.all(metricsPromises);
    
    return {
      workspaceId,
      workspaceName: reports[0]?.datasetWorkspace?.name || 'Unknown',
      reports: reportMetrics,
      aggregateMetrics: this.calculateAggregateMetrics(reportMetrics.map(r => r.metrics))
    };
  } catch (error) {
    this.logger.error(`Failed to get workspace metrics for ${workspaceId}:`, error.message);
    throw new Error(`Failed to get workspace metrics: ${error.message}`);
  }
}

async getAggregateMetrics() {
  try {
    // Get all workspaces
    const workspaces = await this.getWorkspaces();
    if (workspaces.length === 0) {
      return {
        totalViews: 0,
        totalUsers: 0,
        reportCount: 0,
        workspaceCount: 0
      };
    }
    
    // Get metrics for each workspace
    const metricsPromises = workspaces.map(workspace => 
      this.getWorkspaceUsageMetrics(workspace.id)
        .catch(error => ({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          reports: [],
          aggregateMetrics: {
            totalViews: 0,
            totalUsers: 0,
            reportCount: 0
          }
        }))
    );
    
    const workspaceMetrics = await Promise.all(metricsPromises);
    
    // Calculate total metrics
    return {
      totalViews: workspaceMetrics.reduce((sum, ws) => 
        sum + (ws.aggregateMetrics.totalViews || 0), 0),
      totalUsers: new Set(
        workspaceMetrics.flatMap(ws => 
          ws.aggregateMetrics.userIds || [])
      ).size,
      reportCount: workspaceMetrics.reduce((sum, ws) => 
        sum + ws.reports.length, 0),
      workspaceCount: workspaces.length,
      topReports: this.getTopReports(workspaceMetrics),
      topWorkspaces: this.getTopWorkspaces(workspaceMetrics)
    };
  } catch (error) {
    this.logger.error('Failed to get aggregate metrics:', error.message);
    throw new Error(`Failed to get aggregate metrics: ${error.message}`);
  }
}

private calculateAggregateMetrics(metrics) {
  // Extract user IDs if available
  const userIds = metrics.flatMap(m => m.users || [])
    .filter(id => id); // Filter out any nulls
  
  return {
    totalViews: metrics.reduce((sum, m) => sum + (m.viewCount || 0), 0),
    totalUsers: new Set(userIds).size,
    userIds: [...new Set(userIds)],
    avgViewsPerDay: this.calculateAverageViewsPerDay(metrics)
  };
}

private calculateAverageViewsPerDay(metrics: any[]): number {
  const viewsByDay: { [date: string]: number } = {};
  let dayCount = 0;

  // Aggregate views by day
  metrics.forEach((m) => {
    if (m.timeline && Array.isArray(m.timeline)) {
      m.timeline.forEach((day: any) => {
        const date = day.date.split('T')[0];
        viewsByDay[date] = (viewsByDay[date] || 0) + day.count;
      });
    }
  });

  // Calculate total views and number of days
  dayCount = Object.keys(viewsByDay).length;
  const totalViews = Object.values(viewsByDay).reduce((sum: number, count: number) => sum + count, 0);

  // Return average views per day (rounded)
  return dayCount > 0 ? Math.round(totalViews / dayCount) : 0;
}
private getTopReports(workspaceMetrics) {
  const allReports = workspaceMetrics.flatMap(ws =>
    ws.reports.map(report => ({
      id: report.reportId,
      name: report.reportName,
      workspaceId: ws.workspaceId,
      workspaceName: ws.workspaceName,
      views: report.metrics.viewCount || 0,
      users: (report.metrics.users || []).length
    }))
  );
  
  return allReports
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
}

private getTopWorkspaces(workspaceMetrics) {
  return workspaceMetrics
    .map(ws => ({
      id: ws.workspaceId,
      name: ws.workspaceName,
      reports: ws.reports.length,
      views: ws.aggregateMetrics.totalViews || 0,
      users: (ws.aggregateMetrics.userIds || []).length
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
}


   // These ones jsut to check if dataset stuff works
async getReportData(workspaceId: string, datasetId: string) {
  try {
    const token = await this.getAccessToken();
    const url = `${this.apiUrl}/groups/${workspaceId}/datasets/${datasetId}/execute-queries`;
    
    // Example DAX query to get data
    const body = {
      "queries": [
        {
          "query": "EVALUATE VALUES(TableName)" 
        }
      ],
      "serializerSettings": {
        "includeNulls": true
      }
    };

    const response = await this.httpService.axiosRef.post(url, body, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    this.logger.error('Error fetching report data:', error.response?.data || error.message);
    throw error;
  }
}

// Also add a method to get dataset tables
async getDatasetTables(workspaceId: string, datasetId: string) {
  try {
    const token = await this.getAccessToken();
    const url = `${this.apiUrl}/groups/${workspaceId}/datasets/${datasetId}/tables`;

    const response = await this.httpService.axiosRef.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.value;
  } catch (error) {
    this.logger.error('Error fetching dataset tables:', error.response?.data || error.message);
    throw error;
  }
}

async exportReport(workspaceId: string, reportId: string, accessToken: string) {
  try {
    const url = `${this.apiUrl}/groups/${workspaceId}/reports/${reportId}/export`;

    this.logger.debug(`Exporting report ${reportId} from workspace ${workspaceId}`);

    // Make the request to export the report
    const response = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'stream', // Ensure the response is treated as a stream
    });

    return response;
  } catch (error) {
    this.logger.error(`Failed to export report ${reportId}:`, error.message);
    throw new Error(`Failed to export report: ${error.message}`);
  }
}


// async executeQueries(workspaceId: string, datasetId: string, requestBody: any) { // Change parameter type
//   const token = await this.getAccessToken();
//   const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;

//   // Remove manual body construction - use the incoming requestBody directly
//   console.log('Final Request Body:', JSON.stringify(requestBody, null, 2));

//   try {
//     const response = await firstValueFrom(
//       this.httpService.post(url, requestBody, { // Pass requestBody directly
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       })
//     );
//     return response.data;
//   } catch (error) {
//     console.error('Power BI API Error Details:', error.response?.data);
//     throw new Error(`Power BI API Error: ${error.response?.data?.error?.message || error.message}`);
//   }
// }

async executeQueries(workspaceId: string, datasetId: string, requestBody: any) {
  const token = await this.getAccessToken();
  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;

  try {
    // Fetch report names
    const reportMap = await this.getReportNameMap(workspaceId);

    // Execute the query
    const response = await firstValueFrom(
      this.httpService.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    );

    // Map report IDs to names in the response
    if (response.data?.results?.[0]?.tables?.[0]?.rows) {
      response.data.results[0].tables[0].rows = response.data.results[0].tables[0].rows.map((row: any) => {
        const reportId = row['Report views[ReportId]'];
        return {
          ...row,
          'WorkspaceId': workspaceId, 
          'Report views[ReportName]': reportMap.get(reportId) || reportId, 
        };
      });
    }

    return response.data;
  } catch (error) {
    console.error('Power BI API Error Details:');
    throw new Error(`Power BI API Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

async getReportNameMap(workspaceId: string): Promise<Map<string, string>> {
  try {
    const reports = await this.getReports(workspaceId);
    const reportMap = new Map<string, string>();

    reports.forEach((report: any) => {
      reportMap.set(report.id, report.name);
    });

    return reportMap;
  } catch (error) {
    this.logger.error(`Failed to fetch report names for workspace ${workspaceId}:`, error.message);
    throw new Error(`Failed to fetch report names: ${error.message}`);
  }
}

// new ines
// Inside PowerBIService class

private async getAccessibleWorkspaces() {
  return this.getWorkspaces(); // Or use getMyWorkspaceAccess() depending on your needs
}

// async refreshAllUsageData() {
//   const workspaces = await this.getAccessibleWorkspaces();
  
//   for (const workspace of workspaces) {
//     try {
//       const datasets = await this.getDatasets(workspace.id);
      
//       for (const dataset of datasets) {
//         const query = `EVALUATE SUMMARIZECOLUMNS(...)`; // Your DAX query
//         const response = await this.getDatasetData(workspace.id, dataset.id, query);
        
//         await this.storageService.storeUsageData(
//           workspace.id,
//           dataset.id,
//           response.results[0].tables[0].rows
//         );
//       }
//     } catch (error) {
//       this.logger.error(`Failed to process workspace ${workspace.id}: ${error.message}`);
//     }
//   }
// }
// async refreshAllUsageData() {
//   const workspaces = await this.getAccessibleWorkspaces();
  
//   for (const workspace of workspaces) {
//     try {
//       const datasets = await this.getDatasets(workspace.id);
      
//       for (const dataset of datasets) {
//         const query = `EVALUATE SUMMARIZECOLUMNS(
//           'Report views'[Date], 
//           'Report views'[ReportId], 
//           'Report views'[UserKey], 
//           'Report views'[UserId], 
//           'Report views'[DistributionMethod], 
//           'Report views'[ConsumptionMethod],
//           "Views", COUNTROWS('Report views')
//         )`;
        
//         const response = await this.getDatasetData(workspace.id, dataset.id, query);
        
//         await this.storageService.storeUsageData(
//           workspace.id,
//           dataset.id,
//           response.results[0].tables[0].rows
//         );
//       }
//     } catch (error) {
//       this.logger.error(`Failed to process workspace ${workspace.id}: ${error.message}`);
//     }
//   }
// }

// async refreshAllUsageData() {
//   // HARDCODE your known-good workspace/dataset
//   const TARGET_WORKSPACE_ID = '19c566e0-081f-4821-a0d0-6c78984d113c';
//   const TARGET_DATASET_ID = '000894d3-b693-4008-b092-95a03c5064d7';

//   try {
//     const dataset = await this.getDatasets(TARGET_WORKSPACE_ID)
//       .then(datasets => datasets.find(d => d.id === TARGET_DATASET_ID));

//     if (!dataset) throw new Error('Target dataset not found');

//     const response = await this.getDatasetData(
//       TARGET_WORKSPACE_ID,
//       TARGET_DATASET_ID,
//      `EVALUATE SUMMARIZECOLUMNS(
//           'Report views'[Date], 
//           'Report views'[ReportId], 
//           'Report views'[UserKey], 
//           'Report views'[UserId], 
//           'Report views'[DistributionMethod], 
//           'Report views'[ConsumptionMethod],
//           "Views", COUNTROWS('Report views')
//         )` 
//     );

//     await this.storageService.storeUsageData(
//       TARGET_WORKSPACE_ID,
//       TARGET_DATASET_ID,
//       response.results[0].tables[0].rows
//     );
    
//   } catch (error) {
//     this.logger.error(`Sync failed: ${error.message}`);
//   }
// }

async getDatasetData(workspaceId: string, datasetId: string, query: string) {
  const requestBody = {
    queries: [{ query }],
    serializerSettings: { includeNulls: true }
  };

  try {
    const response = await this.executeQueries(workspaceId, datasetId, requestBody);
    return response;
  } catch (error) {
    this.logger.error('Error fetching dataset data:', error);
    throw error;
  }
}
async getDatasets(workspaceId: string) {
  try {
    const token = await this.getAccessToken();
    const url = `${this.apiUrl}/groups/${workspaceId}/datasets`;
    
    const response = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.value;
  } catch (error) {
    this.logger.error(`Failed to get datasets for workspace ${workspaceId}:`, error.message);
    return [];
  }
}




async getWorkspacesWithDatasets() {
  try {
    const workspaces = await this.getWorkspaces();
    
    // Fetch datasets for all workspaces in parallel
    const workspacesWithDatasets = await Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const datasets = await this.getDatasets(workspace.id);
          return {
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            datasets: datasets.map(d => ({
              id: d.id,
              name: d.name,
              configuredBy: d.configuredBy,
              createdDate: d.createdDate
            }))
          };
        } catch (error) {
          this.logger.error(`Failed to get datasets for workspace ${workspace.id}: ${error.message}`);
          return {
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            datasets: [],
            error: error.message
          };
        }
      })
    );

    return workspacesWithDatasets;
  } catch (error) {
    this.logger.error(`Failed to get workspaces: ${error.message}`);
    throw new Error(`Failed to fetch workspaces and datasets: ${error.message}`);
  }
}


// async getFilteredMetrics(workspaceIds?: string[], days = 30): Promise<UsageMetrics> {
//   try {
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(endDate.getDate() - days);

//     // Get activity events for all workspaces
//     const activityData = await this.getActivityEvents(
//       startDate.toISOString().split('T')[0],
//       endDate.toISOString().split('T')[0]
//     );

//     // Get workspace information for filtering
//     const workspaces = await this.getWorkspaces();
    
//     return this.processActivityEvents(
//       activityData,
//       startDate.toISOString().split('T')[0],
//       endDate.toISOString().split('T')[0],
//       workspaceIds,
//       workspaces
//     );
//   } catch (error) {
//     this.logger.error('Failed to get filtered metrics:', error.message);
//     throw new Error('Failed to load metrics data');
//   }
// }

private processActivityEvents(
  activityData: any,
  startDate: string,
  endDate: string,
  workspaceIds?: string[],
  allWorkspaces: any[] = []
): UsageMetrics {
  const metrics: UsageMetrics = {
    viewsByDate: {},
    viewsByReport: {},
    viewsByUser: {},
    totalViews: 0,
    uniqueUsersCount: 0,
    uniqueReportsCount: 0,
    topReports: [],
    topUsers: []
  };

  if (!activityData?.activityEventEntities) return metrics;

  // Create workspace ID to name mapping
  const workspaceMap = new Map<string, string>(
    allWorkspaces.map(ws => [ws.id, ws.name])
  );

  activityData.activityEventEntities.forEach(event => {
    if (event.Activity === 'ViewReport') {
      // Apply workspace filter
      if (workspaceIds && workspaceIds.length > 0 && 
          !workspaceIds.includes(event.WorkspaceId)) {
        return;
      }

      const date = event.CreationTime.split('T')[0];
      const reportId = event.ReportId;
      const userId = event.UserId;
      const workspaceName = workspaceMap.get(event.WorkspaceId) || 'Unknown';

      // Aggregate metrics
      metrics.totalViews++;
      metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + 1;
      
      const reportKey = `${workspaceName} - ${reportId}`;
      metrics.viewsByReport[reportKey] = (metrics.viewsByReport[reportKey] || 0) + 1;
      
      metrics.viewsByUser[userId] = (metrics.viewsByUser[userId] || 0) + 1;
    }
  });

  // Calculate unique counts
  metrics.uniqueUsersCount = new Set(Object.keys(metrics.viewsByUser)).size;
  metrics.uniqueReportsCount = new Set(Object.keys(metrics.viewsByReport)).size;

  // Generate top lists
  metrics.topReports = Object.entries(metrics.viewsByReport)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  metrics.topUsers = Object.entries(metrics.viewsByUser)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return metrics;
}


async getFilteredMetrics(workspaceIds?: string[], days = 30): Promise<UsageMetrics> {
  try {
    const targetWorkspaceId = '19c566e0-081f-4821-a0d0-6c78984d113c';
    const targetDatasetId = '000894d3-b693-4008-b092-95a03c5064d7';
    
    const query = `
      EVALUATE 
      SUMMARIZECOLUMNS(
        'Report views'[Date],
        'Report views'[ReportId],
        'Report views'[UserId],
        "Views", COUNTROWS('Report views')
      )
      ${workspaceIds?.length ? 
        `WHERE 'Report views'[WorkspaceId] IN ${this.formatWorkspaceFilter(workspaceIds)}` 
        : ''}
    `;

    const response = await this.getDatasetData(
      targetWorkspaceId,
      targetDatasetId,
      query
    );

    return this.processDatasetResponse(response);
  } catch (error) {
    this.logger.error('Failed to get filtered metrics:', error.message);
    throw new Error('Failed to load metrics data');
  }
}

private formatWorkspaceFilter(workspaceIds: string[]): string {
  return `{ "${workspaceIds.join('", "')}" }`;
}

private processDatasetResponse(response: any): UsageMetrics {
  const metrics: UsageMetrics = {
    viewsByDate: {},
    viewsByReport: {},
    viewsByUser: {},
    totalViews: 0,
    uniqueUsersCount: 0,
    uniqueReportsCount: 0,
    topReports: [],
    topUsers: []
  };

  const uniqueUsers = new Set<string>();
  const uniqueReports = new Set<string>();

  response.results[0].tables[0].rows.forEach(row => {
    const date = row['Report views[Date]'];
    const reportId = row['Report views[ReportId]'];
    const userId = row['Report views[UserId]'];
    const views = row['Views'];

    // Aggregate metrics
    metrics.totalViews += views;
    metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + views;
    metrics.viewsByReport[reportId] = (metrics.viewsByReport[reportId] || 0) + views;
    metrics.viewsByUser[userId] = (metrics.viewsByUser[userId] || 0) + views;

    uniqueUsers.add(userId);
    uniqueReports.add(reportId);
  });

  // Set unique counts
  metrics.uniqueUsersCount = uniqueUsers.size;
  metrics.uniqueReportsCount = uniqueReports.size;

  // Generate top lists
  metrics.topReports = Object.entries(metrics.viewsByReport)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  metrics.topUsers = Object.entries(metrics.viewsByUser)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return metrics;
}



// powerbi-analytics.service.ts

// async getCombinedMetrics(workspaceIds?: string[]): Promise<UsageMetrics> {
//   // Get data from all workspaces
//   // const workspaces = await this.getWorkspaces();
//   // const filteredWorkspaces = workspaceIds?.length 
//   //   ? workspaces.filter(ws => workspaceIds.includes(ws.id))
//   //   : workspaces;

//   const datasets =  await this.getWorkspacesWithDatasets();
//   const workspaces = datasets.map((ws: any) => ({
//     const datasetId = ws.datasets.find((d: any) => d.name === 'Usage Metrics Report'),
//     return {workspaceId: ws.workspaceId, datasetID: ws.datasets[0].id}
// }));

//   let allMetrics: any[] = [];
//   for (let index in workspaceIds) {
//     const workspaceId = workspaceIds[index];
//     const dataset = await this.getWorkspaceUsageMetrics(workspaceId);
//     allMetrics.push(dataset);
//     }
  
//     console.log(allMetrics);


//   // const allMetrics = await Promise.all(
//   //   workspaceIds.map(ws => 
//   //     this.getWorkspaceUsageMetrics(ws)
//   //       .catch(error => ({ 
//   //         workspaceId: ws,
//   //         reports: [],
//   //         aggregateMetrics: { totalViews: 0, totalUsers: 0 }
//   //       }))
//   //   )
//   // );

//   return this.aggregateAcrossWorkspaces(allMetrics);
// }
async getCombinedMetrics(workspaceIds?: string[]): Promise<any[]> {
  try {
    const workspacesWithDatasets = await this.getWorkspacesWithDatasets();

    const filteredWorkspaces = workspacesWithDatasets
      .map(ws => ({
        workspaceId: ws.workspaceId,
        datasetId: ws.datasets.find(d => d.name === 'Usage Metrics Report')?.id
      }))
      .filter(ws => ws.datasetId)
      .filter(ws => 
        !workspaceIds || 
        workspaceIds.length === 0 || 
        workspaceIds.includes(ws.workspaceId)
      );

    this.logger.debug('Filtered workspaces:', filteredWorkspaces);

    const allData = await Promise.all(
      filteredWorkspaces.map(async ({ workspaceId, datasetId }) => {
        try {
          const query = `
            EVALUATE 
            SUMMARIZECOLUMNS(
              'Report views'[Date],
              'Report views'[ReportId],
              'Report views'[UserId],
              "Views", COUNTROWS('Report views')
            )
          `;
          
          this.logger.debug(`Executing query for workspace ${workspaceId}`);
          const response = await this.executeQueries(
            workspaceId,
            datasetId!,
            {
              queries: [{ query }],
              serializerSettings: { includeNulls: true }
            }
          );

          this.logger.debug(`Query response for workspace ${workspaceId}:`);
          return response.results[0].tables[0].rows;
        } catch (error) {
          this.logger.error(`Failed to query workspace ${workspaceId}:`, error);
          return [];
        }
      })
    );

    console.log(allData);
    const combinedRows = allData.flat();
    return combinedRows;
  } catch (error) {
    this.logger.error('Failed to get combined metrics:', error);
    throw error;
  }
}
// private aggregateAcrossWorkspaces(workspaceMetrics: any[]): UsageMetrics {
//   const metrics: UsageMetrics = {
//     viewsByDate: {},
//     viewsByReport: {},
//     viewsByUser: {},
//     totalViews: 0,
//     uniqueUsersCount: 0,
//     uniqueReportsCount: 0,
//     topReports: [],
//     topUsers: []
//   };

//   workspaceMetrics.forEach(ws => {
//     metrics.totalViews += ws.aggregateMetrics.totalViews;
    
//     // Aggregate dates
//     Object.entries(ws.aggregateMetrics.viewsByDate || {}).forEach(([date, count]) => {
//       metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + count;
//     });

//     // Aggregate reports
//     ws.reports.forEach(report => {
//       const key = `${report.reportId}|${report.reportName}`;
//       metrics.viewsByReport[key] = (metrics.viewsByReport[key] || 0) + report.metrics.viewCount;
//     });
//   });

//   // Convert to sorted arrays
//   metrics.topReports = Object.entries(metrics.viewsByReport)
//     .sort(([,a], [,b]) => b - a)
//     .slice(0, 10)
//     .map(([id, count]) => ({ id, count }));

//   return metrics;
// }
private aggregateAcrossWorkspaces(workspaceMetrics: any[]): UsageMetrics {
  const metrics: UsageMetrics = {
    viewsByDate: {},
    viewsByReport: {},
    viewsByUser: {},
    totalViews: 0,
    uniqueUsersCount: 0,
    uniqueReportsCount: 0,
    topReports: [],
    topUsers: []
  };

  workspaceMetrics.forEach(ws => {
    // Add type assertion for aggregateMetrics
    const aggMetrics = ws.aggregateMetrics as {
      totalViews: number;
      viewsByDate?: Record<string, number>;
    };
    
    metrics.totalViews += aggMetrics.totalViews;

    // Fix date aggregation type
    Object.entries(aggMetrics.viewsByDate || {}).forEach(([date, count]) => {
      metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + (count as number);
    });

    // Fix report aggregation type
    (ws.reports as Array<{reportId: string; reportName: string; metrics: {viewCount: number}}>).forEach(report => {
      const key = `${report.reportId}|${report.reportName}`;
      metrics.viewsByReport[key] = (metrics.viewsByReport[key] || 0) + report.metrics.viewCount;
    });
  });

  // Convert to sorted arrays with type safety
  metrics.topReports = Object.entries(metrics.viewsByReport)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([id, count]) => ({ id, count: count as number }));

  return metrics;
}



}