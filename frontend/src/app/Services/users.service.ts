// src/app/services/user.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


import { Role, User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  //private apiUrl = 'http://localhost:3000/users';
  //private authUrl = 'http://localhost:3000/auth';

  private apiUrl = environment.apiUrl + 'users';
  private authUrl = environment.apiUrl + 'auth';


  constructor(private http: HttpClient) {}

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/findAll`);
  }

  findAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/findAllRoles`);
  }

  create(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create`, userData);
  }

  update(id: number, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, userData);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchADUsers(query: string): Observable<any[]> {
    const body = { searchkey: query };
    return this.http.post<any[]>(`${this.authUrl}/searchUsers`, body);
  }

  updateUserRoles(userId: number, roleIds: number[]): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, {
      user_roles: roleIds.map(roleId => ({ roleId }))
    });
  }

  updateUserStatus(userId: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/users/${userId}`, {
      is_active: isActive
    });
  }
}