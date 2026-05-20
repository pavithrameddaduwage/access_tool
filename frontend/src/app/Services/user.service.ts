// src/app/Services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  //private apiUrl = 'http://localhost:3000/user';
  //private authUrl = 'http://localhost:3000/auth'; 

  private apiUrl = environment.apiUrl + 'user';
  private authUrl = environment.apiUrl + 'auth';

  constructor(private http: HttpClient) {}

  searchADUsers(query: string): Observable<any[]> {
    const body = { searchkey: query };
    return this.http.post<any[]>(`${this.authUrl}/searchUsers`, body);
  }
  
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createUser(user: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, user);
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}