import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { CreateUserWebtoolDto, UserRole, UserWebtool, WebtoolUser } from '../../../interfaces/webtool.interfaces';
import { environment } from '../../environments/environment';

interface LocalWebtoolUser {
  userId: number;
  userName: string;
  email: string;
  department: string;
  roles: [{ id: number; name: string; privileges: string; }] | { [key: string]: Array<{ id: number; name: string; privileges: string }> };
  webtools: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserWebtoolService {
  private apiUrl = environment.apiUrl  + 'user-webtools';
  //private apiUrl = 'http://localhost:3000/user-webtools';

  constructor(private http: HttpClient) {}


  
  // getUserWebtoolsByUser(email: string): Observable<UserWebtool[]> {
  //   return this.http.get<UserWebtool[]>(`${this.apiUrl}/user/${email}`).pipe(
  //     catchError(error => {
  //       console.error('Error fetching user webtools:', error);
  //       return throwError(() => new Error('Failed to fetch user webtools'));
  //     })
  //   );
  // }
  
  getUserWebtoolsByUser(email: string): Observable<UserWebtool[]> {
    return this.http.get<UserWebtool[]>(`${this.apiUrl}/user/${email}`).pipe(
      tap(response => console.log('Response from getUserWebtoolsByUser:', response)),
      catchError(error => {
        console.error('Error in getUserWebtoolsByUser:', error);
        return throwError(() => error);
      })
    );
  }


  findAll(): Observable<UserWebtool[]> {
    return this.http.get<UserWebtool[]>(`${this.apiUrl}`).pipe(
      tap(data => console.log('Raw response from findAll:', data)),
      catchError(error => {
        console.error('Error in findAll:', error);
        return throwError(() => error);
      })
    );
  }
  

  
  updateUserWebtool(id: number, data: { userId: number; webtoolId: number; roleId: number }): Observable<UserWebtool> {
    return this.http.patch<UserWebtool>(`${this.apiUrl}/${id}`, data);
  }

  // deleteUserWebtool(email: string, webtoolId: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${email}/${webtoolId}`).pipe(
  //     catchError(error => {
  //       console.error('Error deleting user webtool:', error);
  //       return throwError(() => new Error('Failed to delete user webtool'));
  //     })
  //   );
  // }
  
  deleteUserWebtool(email: string, webtoolId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${email}/${webtoolId}`).pipe(
      tap(() => console.log(`Deleted user webtool - email: ${email}, webtoolId: ${webtoolId}`)),
      catchError(error => {
        console.error('Error in deleteUserWebtool:', error);
        return throwError(() => error);
      })
    );
  }


  getConsolidatedUserData(): Observable<WebtoolUser[]> {
    return this.getAllUserWebtools().pipe(
      map((userWebtools: UserWebtool[]) => {
        const processedUsers = userWebtools.map(uw => ({
          userId: uw.userId || 0,
          userName: uw.userName,
          email: uw.email,
          department: uw.department,
          roles: uw.roles || {},  
          webtools: uw.webtools || []
        }));
  
        const userMap = new Map<string, LocalWebtoolUser>();
        
        processedUsers.forEach(uw => {
          if (!userMap.has(uw.email)) {
            userMap.set(uw.email, {
              userId: uw.userId,
              userName: uw.userName,
              email: uw.email,
              department: uw.department,
              roles: uw.roles,
              webtools: uw.webtools
            });
          }
        });
  
        return Array.from(userMap.values()) as WebtoolUser[];
      })
    );
  }
  
  deleteUserWebtoolRole(email: string, webtoolId: number, roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${email}/${webtoolId}/role/${roleId}`);
  }

  getAllUserWebtools(): Observable<UserWebtool[]> {
    return this.http.get<UserWebtool[]>(this.apiUrl).pipe(
      tap(data => {
        console.log('Raw data from API:', JSON.stringify(data, null, 2));
        if (data.length > 0) {
          console.log('Sample user structure:', JSON.stringify(data[0], null, 2));
        }
      }),
      map(data => {
        console.log('Transformed data:', data);
        return data;
      }),
      catchError(error => {
        console.error('Error fetching user webtools:', error);
        return throwError(() => error);
      })
    );
  }

// createUserWebtool(data: CreateUserWebtoolDto): Observable<UserWebtool> {
//   console.log('Creating user webtool with data:', data);
//   return this.http.post<UserWebtool>(this.apiUrl, data).pipe(
//     tap(response => {
//       console.log('Create response:', response);
//     }),
//     catchError(error => {
//       console.error('Error creating user webtool:', error);
//       return throwError(() => error);
//     })
//   );
// }

createUserWebtool(data: CreateUserWebtoolDto): Observable<UserWebtool> {
  console.log('Creating user webtool with data:', data);
  return this.http.post<UserWebtool>(this.apiUrl, data).pipe(
    tap(response => console.log('Create response:', response)),
    catchError(error => {
      console.error('Error in createUserWebtool:', error);
      return throwError(() => error);
    })
  );
}

  getUserWebtoolsByWebtool(webtoolId: number): Observable<UserWebtool[]> {
    return this.http.get<UserWebtool[]>(`${this.apiUrl}/webtool/${webtoolId}`).pipe(
      tap(data => console.log(`Received user webtools for webtool ${webtoolId}:`, data))
    );
  }

  updateUserStatus(email: string, webtoolId: number, isActive: boolean): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${email}/${webtoolId}/status`,
      { isActive }
    );
  }
}