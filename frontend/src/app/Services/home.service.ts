import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserMapping } from '../Models/user-mapping.model';



@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = environment.apiUrl + 'user-dashboards';
  //private apiUrl = 'http://localhost:3000/user-dashboards';  
  private authUrl = environment.apiUrl + 'auth';
 //private authUrl = 'http://localhost:3000/auth';

 private url = environment.apiUrl;



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

//  createRecord(email: string, userName: string, department: string, dashboardIds: number[]): Observable<any> {
//   return this.http.post(this.apiUrl, { email, userName, department, dashboardIds });
// }

// updateRecord(email: string, userName: string, department: string, dashboardIds: number[]): Observable<any> {
//   return this.http.put(`${this.apiUrl}/${email}`, { 
//     dashboardIds,
//     userName,
//     department
//   });
// }

createRecord(
  email: string, 
  userName: string, 
  department: string, 
  dashboardIds: number[],
  isActive: boolean = true  // Default to true if not provided
): Observable<any> {
  return this.http.post(this.apiUrl, { 
    email, 
    userName, 
    department, 
    dashboardIds,
    isActive 
  });
}

updateRecord(
  email: string, 
  userName: string, 
  department: string, 
  dashboardIds: number[],
  isActive: boolean
): Observable<any> {
  return this.http.put(`${this.apiUrl}/${email}`, {
    email, // Make sure to include email in the payload
    userName,
    department,
    dashboardIds,
    isActive
  });
}

deleteRecord(email: string): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${email}`);
}
// Fetch a mapping from the backend
getMapping(email: string): Observable<UserMapping | null> {
  const url = `${this.url}user-mappings/${email}`;
  console.log('Fetching mapping from:', url); // Debugging
  return this.http.get<UserMapping | null>(url).pipe(
    catchError(error => {
      console.error('Error fetching mapping:', error);
      return of(null); // Return null if there's an error
    })
  );
}

// Create or update a mapping in the backend
createMapping(email: string, realName: string): Observable<UserMapping> {
  const url = `${this.url}user-mappings`;
  console.log('Creating/updating mapping at:', url); // Debugging
  return this.http.post<UserMapping>(url, { email, realName }).pipe(
    catchError(error => {
      console.error('Error creating/updating mapping:', error);
      return throwError(() => error); // Re-throw the error
    })
  );
}

getDatabaseUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/database/database-users`);
}

getDashboardsByWorkspace(workspaceId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/dashboard-workspace/${workspaceId}`);
}
getPermittedUsers(workspaceId?: string, reportId?: string): Observable<string[]> {
  let params = new HttpParams();

  if (workspaceId) {
    params = params.set('workspaceId', workspaceId);
  }

  if (reportId) {
    params = params.set('reportId', reportId);
  }

  return this.http.get<string[]>(`${this.apiUrl}/permitted`, { params });
}


getDatabaseUsersByWorkspaceAndReportID(workspaceName: string, reportName: string): Observable<any[]> {
  return this.http.post<any[]>(`${this.apiUrl}/activeUsers/getDatabaseUsersByWorkspaceAndReportID`, { workspaceName, reportName });
}

}