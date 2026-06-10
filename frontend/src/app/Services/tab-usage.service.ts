import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PowerBIMetricsService } from './powerbi-metrics.service';

export interface DashboardSummary {
  totalViews: number;
  uniqueViewers: number;
  pagesTracked: number;
  avgTimePerVisitSeconds: number;
}

export interface PageAnalyticsRow {
  pageName: string;
  views: number;
  uniqueUsers: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  lastAccessed: Date | null;
  status: 'active' | 'not_accessed';
  color: string;
}

export interface PageUserRow {
  userId: string;
  displayName: string;
  email: string;
  viewCount: number;
  totalDurationSeconds: number;
  lastSeen: Date;
}

export interface TopViewerRow {
  userId: string;
  displayName: string;
  email: string;
  viewCount: number;
  lastSeen: Date;
  avatarIndex: number;
}

export interface ViewerActivityRow {
  userId: string;
  displayName: string;
  email: string;
  totalViews: number;
  lastSeen: Date;
  pagesVisited: { pageName: string; color: string }[];
}

@Injectable({ providedIn: 'root' })
export class TabUsageService {
  private apiUrl = 'http://localhost:3000/api/powerbi-metrics';
  private chartColors = [
    '#2563EB', '#059669', '#D97706', '#7C3AED',
    '#DC2626', '#0891B2', '#EA580C', '#0D9488'
  ];

  constructor(
    private http: HttpClient,
    private metricsService: PowerBIMetricsService
  ) {}

  getDashboardList(period: string): Observable<string[]> {
    return this.http.get<{ dashboards: string[] }>(
      `${this.apiUrl}/dashboard-list?period=${period}`
    ).pipe(
      map(res => res.dashboards || []),
      catchError(() => of([]))
    );
  }

  getDashboardSummary(dashboard: string, period: string): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(
      `${this.apiUrl}/dashboard-summary?dashboard=${encodeURIComponent(dashboard)}&period=${period}`
    ).pipe(
      catchError(() => of({
        totalViews: 0,
        uniqueViewers: 0,
        pagesTracked: 0,
        avgTimePerVisitSeconds: 0
      }))
    );
  }

  getPageAnalytics(dashboard: string, period: string): Observable<PageAnalyticsRow[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/page-analytics?dashboard=${encodeURIComponent(dashboard)}&period=${period}`
    ).pipe(
      map(items => items.map((item, idx) => ({
        pageName: item.pageName || item.name || 'Unknown',
        views: item.views || item.viewCount || 0,
        uniqueUsers: item.uniqueUsers || item.userCount || 0,
        totalDurationSeconds: item.totalDurationSeconds || 0,
        avgDurationSeconds: item.avgDurationSeconds || 0,
        lastAccessed: item.lastAccessed ? new Date(item.lastAccessed) : null,
        status: (item.views || item.viewCount || 0) > 0 ? 'active' : 'not_accessed',
        color: this.chartColors[idx % this.chartColors.length]
      }))),
      catchError(() => of([]))
    );
  }

  getPageUserBreakdown(dashboard: string, page: string, period: string): Observable<PageUserRow[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/page-user-breakdown?dashboard=${encodeURIComponent(dashboard)}&page=${encodeURIComponent(page)}&period=${period}`
    ).pipe(
      switchMap(items => {
        const userIds = items.map(u => u.userId).filter(Boolean);
        if (userIds.length === 0) return of([]);

        return this.metricsService.getUserBatch(userIds).pipe(
          map(userMap => items.map(item => ({
            userId: item.userId,
            displayName: userMap[item.userId]?.displayName || userMap[item.userId]?.name || item.userId,
            email: userMap[item.userId]?.email || '',
            viewCount: item.viewCount || 0,
            totalDurationSeconds: item.totalDurationSeconds || 0,
            lastSeen: new Date(item.lastSeen)
          }))),
          catchError(() => of(items.map(item => ({
            userId: item.userId,
            displayName: item.displayName || item.userId,
            email: item.email || '',
            viewCount: item.viewCount || 0,
            totalDurationSeconds: item.totalDurationSeconds || 0,
            lastSeen: new Date(item.lastSeen)
          }))))
        );
      }),
      catchError(() => of([]))
    );
  }

  getDashboardTopViewers(dashboard: string, period: string): Observable<TopViewerRow[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/dashboard-top-viewers?dashboard=${encodeURIComponent(dashboard)}&period=${period}`
    ).pipe(
      switchMap(items => {
        const userIds = items.map(u => u.userId).filter(Boolean);
        if (userIds.length === 0) return of([]);

        return this.metricsService.getUserBatch(userIds).pipe(
          map(userMap => items.map((item, idx) => ({
            userId: item.userId,
            displayName: userMap[item.userId]?.displayName || userMap[item.userId]?.name || item.userId,
            email: userMap[item.userId]?.email || '',
            viewCount: item.viewCount || 0,
            lastSeen: new Date(item.lastSeen),
            avatarIndex: idx % 8
          }))),
          catchError(() => of(items.map((item, idx) => ({
            userId: item.userId,
            displayName: item.displayName || item.userId,
            email: item.email || '',
            viewCount: item.viewCount || 0,
            lastSeen: new Date(item.lastSeen),
            avatarIndex: idx % 8
          }))))
        );
      }),
      catchError(() => of([]))
    );
  }

  getDashboardViewerActivity(dashboard: string, period: string): Observable<ViewerActivityRow[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/dashboard-viewer-activity?dashboard=${encodeURIComponent(dashboard)}&period=${period}`
    ).pipe(
      switchMap(items => {
        const userIds = items.map(u => u.userId).filter(Boolean);
        if (userIds.length === 0) return of([]);

        return this.metricsService.getUserBatch(userIds).pipe(
          map(userMap => items.map((item, idx) => ({
            userId: item.userId,
            displayName: userMap[item.userId]?.displayName || userMap[item.userId]?.name || item.userId,
            email: userMap[item.userId]?.email || '',
            totalViews: item.totalViews || 0,
            lastSeen: new Date(item.lastSeen),
            pagesVisited: (item.pagesVisited || []).map((page: any, pageIdx: number) => ({
              pageName: typeof page === 'string' ? page : page.pageName,
              color: this.chartColors[pageIdx % this.chartColors.length]
            }))
          }))),
          catchError(() => of(items.map((item, idx) => ({
            userId: item.userId,
            displayName: item.displayName || item.userId,
            email: item.email || '',
            totalViews: item.totalViews || 0,
            lastSeen: new Date(item.lastSeen),
            pagesVisited: (item.pagesVisited || []).map((page: any, pageIdx: number) => ({
              pageName: typeof page === 'string' ? page : page.pageName,
              color: this.chartColors[pageIdx % this.chartColors.length]
            }))
          }))))
        );
      }),
      catchError(() => of([]))
    );
  }

  private getChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }
}
