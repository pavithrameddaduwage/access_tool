import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginAnalyticsService {
  private apiUrl = `${environment.apiUrl}analytics/`;

  constructor(private http: HttpClient) {}

  getSummary(days: number = 30, webtool?: string): Observable<any> {
    let params: any = { days };
    if (webtool) {
      params.webtool = webtool;
    }
    
    return this.http.get(`${this.apiUrl}summary`, { 
      params 
    });
  }
  
  getDailyLogins(days: number = 30, webtool?: string): Observable<any> {
    let params: any = { days };
    if (webtool) {
      params.webtool = webtool;
    }
    
    return this.http.get(`${this.apiUrl}daily-logins`, {
      params
    });
  }
  getUserStats(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}user-stats?email=${email}`);
  }


getLoginsByHour(webtool?: string): Observable<any> {
  let params: any = {};
  if (webtool) {
    params.webtool = webtool;
  }
  
  return this.http.get(`${this.apiUrl}logins-by-hour`, { params });
}

getLoginsByDayOfWeek(webtool?: string): Observable<any> {
  let params: any = {};
  if (webtool) {
    params.webtool = webtool;
  }
  
  return this.http.get(`${this.apiUrl}logins-by-day`, { params });
}

getLoginEvents(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}login-events`).pipe(
    catchError(error => {
      console.error('Error fetching login events:', error);
      return of([]);
    })
  );
}
}
