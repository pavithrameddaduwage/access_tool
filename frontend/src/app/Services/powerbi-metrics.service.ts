import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}

interface Workspace {
  id: string;
  name: string;
}

interface Report {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class PowerBIMetricsService {
  private apiUrl = `${environment.apiUrl}powerbi-metrics`;

  constructor(private http: HttpClient) { }

  getAllLogEntries(startDate: Date, endDate: Date): Observable<PowerBILog[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<PowerBILog[]>(this.apiUrl, { params });
  }

  getLogs(startDate: Date, endDate: Date): Observable<PowerBILog[]> {
    return this.getAllLogEntries(startDate, endDate);
  }

  getWorkspaceLogs(workspaceId: string, startDate: Date, endDate: Date): Observable<PowerBILog[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      workspaceId
    };
    return this.http.get<PowerBILog[]>(`${this.apiUrl}/workspace`, { params });
  }
  

  getReportLogs(reportId: string, startDate: Date, endDate: Date): Observable<PowerBILog[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reportId
    };
    return this.http.get<PowerBILog[]>(`${this.apiUrl}/report`, { params });
  }

  // Add this if you need to get workspace names
  // getWorkspaces(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/workspaces`);
  // }




  getViewsByDate(startDate: Date, endDate: Date): Observable<{date: string, count: number}[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<{date: string, count: number}[]>(`${this.apiUrl}/views-by-date`, { params });
  }

  getTopReports(startDate: Date, endDate: Date, limit: number = 10): Observable<{reportId: string, reportName: string, count: number}[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: limit.toString()
    };
    return this.http.get<{reportId: string, reportName: string, count: number}[]>(`${this.apiUrl}/top-reports`, { params });
  }

  getTopUsers(startDate: Date, endDate: Date, limit: number = 10): Observable<{userId: string, count: number}[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: limit.toString()
    };
    return this.http.get<{userId: string, count: number}[]>(`${this.apiUrl}/top-users`, { params });
  }

  getUserActivityTrend(startDate: Date, endDate: Date): Observable<{date: string, count: number}[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<{date: string, count: number}[]>(`${this.apiUrl}/user-activity-trend`, { params });
  }

  getUserMetrics(userId: string, startDate: Date, endDate: Date): Observable<{
    totalViews: number;
    reports: {reportId: string, reportName: string}[];
    workspaces: {workspaceId: string, workspaceName: string}[];
    activityByDate: {date: string, count: number}[];
  }> {
    const params = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<any>(`${this.apiUrl}/user-metrics`, { params });
  }

  getUniqueUserCount(startDate: Date, endDate: Date): Observable<number> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<number>(`${this.apiUrl}/unique-user-count`, { params });
  }
  
  getUniqueReportCount(startDate: Date, endDate: Date): Observable<number> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<number>(`${this.apiUrl}/unique-report-count`, { params });
  }
  getWorkspaceViewsDistribution(userId: string, startDate: Date, endDate: Date): Observable<{workspaceId: string, workspaceName: string, count: number}[]> {
    const params = {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<{workspaceId: string, workspaceName: string, count: number}[]>(`${this.apiUrl}/workspace-views-distribution`, { params });
  }


  getWorkspaces(startDate: Date, endDate: Date): Observable<PowerBIWorkspace[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<PowerBIWorkspace[]>(`${this.apiUrl}/workspaces`, { params });
  }
  
  getReports(startDate: Date, endDate: Date, workspaceId?: string | null): Observable<PowerBIReport[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) {
      params.workspaceId = workspaceId;
    }
    return this.http.get<PowerBIReport[]>(`${this.apiUrl}/reports`, { params });
  }

  getPowerBIMetrics(
    startDate: Date, 
    endDate: Date,
    workspaceId?: string | null,
    reportId?: string | null
  ): Observable<any> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    if (workspaceId) {
      params.workspaceId = workspaceId;
    }
    if (reportId) {
      params.reportId = reportId;
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

}