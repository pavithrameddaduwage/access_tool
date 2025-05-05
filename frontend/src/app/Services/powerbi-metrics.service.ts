import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PowerBILog {
  id: string;
  recordType: number;
  creationTime: Date;
  operation: string;
  organizationId: string;
  userType: number;
  userKey: string;
  workload: string;
  userId: string;
  clientIP?: string;
  userAgent?: string;
  activity?: string;
  itemName?: string;
  workSpaceName?: string;
  datasetName?: string;
  reportName?: string;
  capacityId?: string;
  capacityName?: string;
  workspaceId?: string;
  objectId?: string;
  datasetId?: string;
  reportId?: string;
  artifactId?: string;
  artifactName?: string;
  isSuccess?: boolean;
  reportType?: string;
  requestId?: string;
  activityId?: string;
  distributionMethod?: string;
  consumptionMethod?: string;
  artifactKind?: string;
  refreshEnforcementPolicy?: number;
  billingType?: number;
  storedAt: Date;
}

export interface PowerBIWorkspace {
  id: string;
  name: string;
}

export interface PowerBIReport {
  id: string;
  name: string;
  workspaceId: string;
}

interface ViewCount {
  date: string;
  count: number;
}

interface ReportMetric {
  reportId: string;
  reportName: string;
  count: number;
}

interface UserMetric {
  userId: string;
  count: number;
}

interface UserActivity {
  date: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class PowerBIMetricsService {
  private apiUrl = `${environment.apiUrl}powerbi-metrics`;


  constructor(private http: HttpClient) { }

  // Basic log retrieval methods
  getAllLogEntries(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Observable<PowerBILog[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<PowerBILog[]>(this.apiUrl, { params });
  }

  getWorkspaceLogs(workspaceId: string, startDate: Date, endDate: Date): Observable<PowerBILog[]> {
    return this.getAllLogEntries(startDate, endDate, workspaceId);
  }

  getReportLogs(reportId: string, startDate: Date, endDate: Date): Observable<PowerBILog[]> {
    return this.getAllLogEntries(startDate, endDate, undefined, reportId);
  }

  getUserConsumptionMethods(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Observable<{method: string | null, count: number}[]> {
    const params = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    
    return this.http.get<{method: string | null, count: number}[]>(
      `${this.apiUrl}/user-consumption-methods`, 
      { params }
    );
  }
  //   getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Observable<PowerBIWorkspace[]> {
  //   const params: any = {
  //     startDate: startDate.toISOString(),
  //     endDate: endDate.toISOString()
  //   };
  //   if (reportId) params.reportId = reportId;
    
  //   return this.http.get<PowerBIWorkspace[]>(`${this.apiUrl}/distinct-workspaces`, { params });
  // }

  getDistinctReports(startDate: Date, endDate: Date, workspaceId?: string): Observable<PowerBIReport[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    
    return this.http.get<PowerBIReport[]>(`${this.apiUrl}/distinct-reports`, { params });
  }

  // Metric methods with filtering
  getViewCountsByDate(
    startDate: Date, 
    endDate: Date, 
    workspaceId?: string, 
    reportId?: string
  ): Observable<ViewCount[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<ViewCount[]>(`${this.apiUrl}/views-by-date`, { params });
  }

  getTopReports(
    startDate: Date, 
    endDate: Date, 
    limit: number = 10,
    workspaceId?: string
  ): Observable<ReportMetric[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: limit.toString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    
    return this.http.get<ReportMetric[]>(`${this.apiUrl}/top-reports`, { params });
  }

  getTopUsers(
    startDate: Date, 
    endDate: Date, 
    limit: number = 10,
    workspaceId?: string,
    reportId?: string
  ): Observable<UserMetric[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: limit.toString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<UserMetric[]>(`${this.apiUrl}/top-users`, { params });
  }
  getUserActivityByDate(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    workspaceId?: string,
    reportId?: string
  ): Observable<{date: string, count: number}[]> {
    const params: any = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<{date: string, count: number}[]>(
      `${this.apiUrl}/user-activity-by-date`,
      { params }
    );
  }
  getUserActivityTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
    reportId?: string
  ): Observable<{date: string, count: number}[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...(workspaceId && { workspaceId }),
      ...(reportId && { reportId })
    };
  
    return this.http.get<{date: string, count: number}[]>(`${this.apiUrl}/user-activity-trend`, { params })
      .pipe(
        map(response => response.map(item => ({
          date: item.date, // Keep as YYYY-MM-DD
          count: item.count
        }))),
        catchError(error => {
          console.error('Error fetching activity trend:', error);
          return of([]);
        })
      );
  }
  getUniqueUserCount(
    startDate: Date, 
    endDate: Date,
    workspaceId?: string,
    reportId?: string
  ): Observable<number> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<number>(`${this.apiUrl}/unique-user-count`, { params });
  }

  getUniqueReportCount(
    startDate: Date, 
    endDate: Date,
    workspaceId?: string
  ): Observable<number> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    
    return this.http.get<number>(`${this.apiUrl}/unique-report-count`, { params });
  }

  // User-specific methods
  getUserMetrics(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    workspaceId?: string,
    reportId?: string
  ): Observable<{
    totalViews: number;
    reports: {reportId: string, reportName: string}[];
    workspaces: {workspaceId: string, workspaceName: string}[];
    activityByDate: {date: string, count: number}[];
  }> {
    const params: any = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<any>(`${this.apiUrl}/user-metrics`, { params });
  }

  getWorkspaceViewsDistribution(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    reportId?: string
  ): Observable<{workspaceId: string, workspaceName: string, count: number}[]> {
    const params: any = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (reportId) params.reportId = reportId;
    
    return this.http.get<{workspaceId: string, workspaceName: string, count: number}[]>(
      `${this.apiUrl}/workspace-views-distribution`, 
      { params }
    );
  }

  // Comprehensive metrics with filtering
  getPowerBIMetrics(
    startDate: Date, 
    endDate: Date,
    workspaceId?: string,
    reportId?: string
  ): Observable<any> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
    
    return this.http.get<any>(this.apiUrl, { params });
  }

  getUserReportViewsDistribution(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    workspaceId?: string
  ): Observable<{reportId: string, reportName: string, count: number}[]> {
    const params: any = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    
    return this.http.get<{reportId: string, reportName: string, count: number}[]>(
      `${this.apiUrl}/user-report-views-distribution`, 
      { params }
    );
  }

  

  getDailyUserReportViews(
    userId: string, 
    date: Date,
    workspaceId?: string,
    reportId?: string
  ): Observable<{reportId: string, reportName: string, count: number}[]> {
    const params: any = {
      userId,
      date: date.toISOString().split('T')[0]
    };
    
    if (workspaceId) params.workspaceId = workspaceId;
    if (reportId) params.reportId = reportId;
  
    return this.http.get<any[]>(`${this.apiUrl}/daily-user-reports`, { params });
  }



  getUnusedReports(
    startDate: Date, 
    endDate: Date,
    workspaceId?: string
  ): Observable<{id: number, dashboard: string, groupId: number | null}[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) params.workspaceId = workspaceId;
    
    return this.http.get<{id: number, dashboard: string, groupId: number | null}[]>(
      `${this.apiUrl}/unused-reports`, 
      { params }
    );
  }

  getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Observable<PowerBIWorkspace[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (reportId) params.reportId = reportId;
    
    return this.http.get<PowerBIWorkspace[]>(`${this.apiUrl}/distinct-workspaces`, { params }).pipe(
      map(workspaces => {
        // Frontend normalization for safety
        return workspaces.map(ws => ({
          ...ws,
          name: ws.name?.startsWith('PersonalWorkspace') ? 'PersonalWorkspace' : ws.name
        }));
      }),
      // Remove duplicates after normalization
      map(workspaces => [...new Map(workspaces.map(ws => [ws.id, ws])).values()])
    );
  }
  
}