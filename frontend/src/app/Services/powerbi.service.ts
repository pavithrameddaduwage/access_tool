// src/app/services/powerbi.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PowerBIService {
  private apiUrl = `${environment.apiUrl}powerbi-analytics`;
  
  // You'll replace this with your actual report ID from the workspace
  private usageMetricsReportId = '80e84378-bffe-465d-a413-cb5a1e3346c0';
  private workspaceId = '19c566e0-081f-4821-a0d0-6c78984d113c';

  constructor(private http: HttpClient) {
    this.discoverUsageMetricsReport();
  }

  private discoverUsageMetricsReport() {
    this.getWorkspaces().pipe(
      tap(workspaces => {
        if (workspaces && workspaces.length > 0) {
          this.workspaceId = workspaces[0].id;
          this.getReports(this.workspaceId).subscribe(reports => {
            const usageReport = reports.find(r => 
              r.name.toLowerCase().includes('usage') || 
              r.name.toLowerCase().includes('metrics'));
            
            if (usageReport) {
              this.usageMetricsReportId = usageReport.id;
              // console.log('Found usage metrics report:', usageReport.name, usageReport.id);
            } else if (reports.length > 0) {
              this.usageMetricsReportId = reports[0].id;
              // console.log('Using first available report:', reports[0].name, reports[0].id);
            }
          });
        }
      })
    ).subscribe();
  }

  getWorkspaces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workspaces`).pipe(
      catchError(error => {
        console.error('Error fetching workspaces:', error);
        return of([]);
      })
    );
  }

  getReports(workspaceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups/${workspaceId}/reports`).pipe(
      catchError(error => {
        console.error(`Error fetching reports for workspace ${workspaceId}:`, error);
        return of([]);
      })
    );
  }

  getAggregateMetrics(): Observable<any> {
    if (!this.workspaceId || !this.usageMetricsReportId) {
      return of({
        totalViews: 0,
        totalUsers: 0,
        reportCount: 0,
        workspaceCount: 0,
        topReports: [],
        topWorkspaces: []
      });
    }
    
    return this.http.get<any>(`${this.apiUrl}/metrics/report/${this.workspaceId}/${this.usageMetricsReportId}`).pipe(
      tap(data => console.log('Metrics data:')),
      catchError(error => {
        console.error('Error fetching metrics:', error);
        return of({
          totalViews: 0,
          totalUsers: 0,
          reportCount: 0,
          workspaceCount: 0,
          topReports: [],
          topWorkspaces: []
        });
      })
    );
  }


  getReportUsageMetrics(workspaceId: string, reportId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/report/${workspaceId}/${reportId}`).pipe(
      catchError(error => {
        console.error(`Error fetching metrics for report ${reportId}:`, error);
        return of(null);
      })
    );
  }




  getTables(workspaceId: string, datasetId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/workspace/${workspaceId}/dataset/${datasetId}/tables`);
  }
  
  getReportData(workspaceId: string, datasetId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/workspace/${workspaceId}/dataset/${datasetId}/data`, {});
  }




  getUsageMetrics(days = 30): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/usage?days=${days}`).pipe(
      tap(data => console.log('Usage metrics data:')),
      catchError(error => {
        console.error('Error fetching usage metrics:', error);
        return of({
          totalViews: 0,
          uniqueUsers: 0,
          uniqueReports: 0,
          viewsByDate: {},
          topReports: [],
          topUsers: []
        });
      })
    );
  }

  // getDatasetData(workspaceId: string, datasetId: string, query: string): Observable<any> {
  //   const url = `${this.apiUrl}/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;
  //   const body = {
  //     queries: [{ query }],
  //     serializerSettings: { includeNulls: true }
  //   };
  //   return this.http.post(url, body).pipe(
  //     catchError(error => {
  //       console.error('Error fetching dataset data:', error);
  //       return of(null);
  //     })
  //   );
  // }
  
  getDatasetData(workspaceId: string, datasetId: string, query: string): Observable<any> {
    const url = `${this.apiUrl}/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;
    const body = {
      queries: [{ query }],
      serializerSettings: { includeNulls: true }
    };
    return this.http.post(url, body).pipe(
      map((response: any) => {
        if (response?.results?.[0]?.tables?.[0]?.rows) {
          response.results[0].tables[0].rows = response.results[0].tables[0].rows.map((row: any) => {
            const reportId = row['Report views[ReportId]'];
            return {
              ...row,
              'Report views[ReportName]': row['Report views[ReportName]'] || reportId, // Use report name if available
            };
          });
        }
        return response;
      }),
      catchError(error => {
        console.error('Error fetching dataset data:', error);
        return of(null);
      })
    );
  }


  getCombinedMetrics(workspaceIds?: string[]): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/combined-metrics${workspaceIds?.length ? `?workspaceIds=${workspaceIds.join(',')}` : ''}`
    );
  }
}