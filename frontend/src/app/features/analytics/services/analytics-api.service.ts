import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AnalyticsQuery,
  ComponentViewerRow,
  DashboardRow,
  Overview,
  ReportRow,
  TopViewRow,
  UserDetail,
  UserRow,
  UserViewRow,
} from '../models/analytics.models';

/** Engagement analytics base (environment.apiUrl ends with '/'). */
const BASE = `${environment.apiUrl}api/analytics/engagement`;

/** All HTTP calls to the engagement analytics endpoints. */
@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  constructor(private http: HttpClient) {}

  /** KPI overview for the period. */
  getOverview(query: AnalyticsQuery): Observable<Overview> {
    return this.http.get<Overview>(`${BASE}/overview`, { params: this.toParams(query) });
  }

  /** Per-dashboard engagement rollup. */
  getDashboards(query: AnalyticsQuery): Observable<DashboardRow[]> {
    return this.http.get<DashboardRow[]>(`${BASE}/dashboards`, { params: this.toParams(query) });
  }

  /** Per-report Power BI audit rollup. */
  getReports(query: AnalyticsQuery): Observable<ReportRow[]> {
    return this.http.get<ReportRow[]>(`${BASE}/reports`, { params: this.toParams(query) });
  }

  /** All users with engaged time + view totals. */
  getUsers(query: AnalyticsQuery): Observable<UserRow[]> {
    return this.http.get<UserRow[]>(`${BASE}/users`, { params: this.toParams(query) });
  }

  /** Single-user detail (sessions + views + audit). */
  getUserDetail(userId: string, query: AnalyticsQuery): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${BASE}/users/${encodeURIComponent(userId)}`, {
      params: this.toParams(query),
    });
  }

  /** Top components by view count, optionally filtered by type. */
  getTopViews(query: AnalyticsQuery, type?: string, limit = 20): Observable<TopViewRow[]> {
    let params = this.toParams(query).set('limit', String(limit));
    if (type) params = params.set('type', type);
    return this.http.get<TopViewRow[]>(`${BASE}/views/top`, { params });
  }

  /** Components viewed by a single user. */
  getViewsByUser(userId: string, query: AnalyticsQuery): Observable<UserViewRow[]> {
    return this.http.get<UserViewRow[]>(
      `${BASE}/views/by-user/${encodeURIComponent(userId)}`,
      { params: this.toParams(query) },
    );
  }

  /** Users who viewed a single component. */
  getViewsByComponent(type: string, id: string): Observable<ComponentViewerRow[]> {
    return this.http.get<ComponentViewerRow[]>(
      `${BASE}/views/by-component/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    );
  }

  private toParams(query: AnalyticsQuery): HttpParams {
    let params = new HttpParams();
    if (query.period) params = params.set('period', query.period);
    if (query.department) params = params.set('department', query.department);
    return params;
  }
}
