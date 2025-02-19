import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PowerBIService {
  private apiUrl = '/api/powerbi'; 
  constructor(private http: HttpClient) {}

  getWorkspaces(): Observable<any> {
    return this.http.get(`${this.apiUrl}/workspaces`);
  }

  getWorkspaceMetrics(workspaceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/metrics/workspace/${workspaceId}`);
  }

  getAggregateMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/metrics/aggregate`);
  }
}

