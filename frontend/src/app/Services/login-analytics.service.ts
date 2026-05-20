import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginAnalyticsService {
  private apiUrl = `${environment.apiUrl}analytics/`;

  constructor(private http: HttpClient) {}
  private log = {
    debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args)
  };


getUserStats(email: string, webtool?: string, days: number = 30): Observable<any> {
  this.log.debug(`getUserStats called for email: ${email}, webtool: ${webtool}, days: ${days}`);
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  
  return this.http.get(`${this.apiUrl}user-stats/${email}`, { params }).pipe(
    tap(response => this.log.debug('getUserStats response:', response)),
    catchError(error => {
      this.log.error('getUserStats error:', error);
      return throwError(() => error);
    })
  );
}



getLoginEvents(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}login-events`).pipe(
    catchError(error => {
      console.error('Error fetching login events:', error);
      return of([]);
    })
  );
}

getSummary(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}summary`, { params });
}

getDailyLogins(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}daily-logins`, { params });
}

getLoginsByHour(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days: days.toString() };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}logins-by-hour`, { params });
}

getLoginsByDayOfWeek(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days: days.toString() };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}logins-by-day`, { params });
}

getDepartmentLoginStats(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}department-logins`, { params });
}

getDepartmentHourlyLogins(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}department-hourly-logins`, { params });
}

getDepartmentDailyLogins(days: number = 30, webtool?: string, email?: string): Observable<any> {
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}department-daily-logins`, { params });
}

getUserWebtoolStats(email: string, days: number = 30): Observable<any> {
  return this.http.get(`${this.apiUrl}user-webtool-stats/${email}`, { 
    params: { days } 
  });
}

getTopActiveUsers(days: number = 30, webtool?: string): Observable<any> {
  let params: any = { days };
  if (webtool) params.webtool = webtool;
  
  return this.http.get(`${this.apiUrl}top-active-users`, { params });
}

getTopUsedWebtools(days: number = 30, email?: string): Observable<any> {
  let params: any = { days };
  if (email) params.email = email;
  
  return this.http.get(`${this.apiUrl}top-used-webtools`, { params });
}

getPeakHourUsers(hour: number, days: number = 30, webtool?: string): Observable<any[]> {
  let params = new HttpParams()
    .set('days', days.toString());

  if (webtool) {
    params = params.set('webtool', webtool);
  }

  return this.http.get<any[]>(`${this.apiUrl}peak-hour-users/${hour}`, { params });
}

}
