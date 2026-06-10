import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface PageSessionStart {
  dashboardName: string;
  pageName: string;
  pageId: string;
  userId: string;
  entryTime: string;
  sessionId: string;
}

export interface PageSessionEnd {
  dashboardName: string;
  pageName: string;
  pageId: string;
  userId: string;
  entryTime: string;
  exitTime: string;
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class PageTrackingService {
  private apiUrl = 'http://localhost:3000/api/powerbi-metrics';

  constructor(private http: HttpClient) {}

  startPageSession(data: PageSessionStart): Observable<any> {
    return this.http.post(`${this.apiUrl}/page-view/start`, data)
      .pipe(
        catchError(error => {
          console.warn('Page tracking start failed silently:', error);
          return of(null);
        })
      );
  }

  endPageSession(data: PageSessionEnd): Observable<any> {
    return this.http.post(`${this.apiUrl}/page-view/end`, data)
      .pipe(
        catchError(error => {
          console.warn('Page tracking end failed silently:', error);
          return of(null);
        })
      );
  }
}
