import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = environment.apiUrl + 'user-dashboards';
  //private apiUrl = 'http://localhost:3000/user-dashboards';  
  private authUrl = environment.apiUrl + 'auth';
 //private authUrl = 'http://localhost:3000/auth';


  constructor(private http: HttpClient) {}

  searchADUsers(query: string): Observable<any[]> {
    console.log('HomeService: sending search request');
    const body = { searchkey: query };
    
    return this.http.post<any[]>(`${this.authUrl}/searchUsers`, body).pipe(
      tap(response => console.log('HomeService: received response:', response)),
      map(users => Array.isArray(users) ? users : []),
      catchError(error => {
        console.error('HomeService: error in search:', error);
        return of([]);
      })
    );
  }
  

   getRecords(): Observable<any[]> {
   return this.http.get<any[]>(this.apiUrl);
 }

 createRecord(email: string, userName: string, department: string, dashboardIds: number[]): Observable<any> {
  return this.http.post(this.apiUrl, { email, userName, department, dashboardIds });
}

updateRecord(email: string, userName: string, department: string, dashboardIds: number[]): Observable<any> {
  return this.http.put(`${this.apiUrl}/${email}`, { 
    dashboardIds,
    userName,
    department
  });
}

deleteRecord(email: string): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${email}`);
}
}