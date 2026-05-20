import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public userSubject = new BehaviorSubject<any>({});
  public islogged = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      this.setIsLogged(true);
    }
  }
  public userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  setUser(user: any) {
    this.userSubject.next(user);
  }

  setIsLogged(isLogged: boolean) {
    this.islogged.next(isLogged);
  }

  // login(data: any): Observable<any> {
  //   // console.log('Login request data:', data);
  //   return this.http.post(`${environment.apiUrl}auth/login`, data)
  //     .pipe(
  //       tap(response => console.log('Login response:'))
  //     );
  // }

login(data: any): Observable<any> {
  const headers = new HttpHeaders({
    'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return this.http.post(`${environment.apiUrl}auth/login`, data, { headers })
    .pipe(
      tap(response => console.log('Login response:'))
    );
}
  logout() {
    localStorage.removeItem('token');
    this.setIsLogged(false);
    this.setUser({});
  }
}