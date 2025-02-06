// dashboard.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


interface DashboardType {
  type: {
    id: number;
    type: string;
  };
}

interface DashboardValuetype {
  valuetype: {
    id: number;
    valuetype: string;
  };
}

interface DashboardWorkspace {
  workspace: {
    id: number;
    workspace: string;
  };
}

interface DashboardData {
  id: number;
  dashboard: string;
  dashboardTypes: DashboardType[];
  dashboardValuetypes: DashboardValuetype[];
  dashboardWorkspaces: DashboardWorkspace[];
  group?: {
    id: number;
    group: string;
  };
}
interface CreateDashboardDto {
  dashboard: string;
  typeIds: number[];
  valueTypeIds: number[];
  workspaceIds: number[];
  groupId?: number;  
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl + 'dashboard';

  constructor(private http: HttpClient) {}

  getDashboards(): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(this.apiUrl);
  }

  createDashboard(dashboard: CreateDashboardDto): Observable<DashboardData> {
    return this.http.post<DashboardData>(this.apiUrl, dashboard);
  }

  updateDashboard(id: number, dashboard: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dashboard);
  }
  
  deleteDashboard(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}