import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';



interface RoleData {
  id?: number;
  roles: string;
  privileges: string;
  webtoolId: number;
}

interface Role {
  id: number;
  roles: string;
  privileges: string;
  webtool: { id: number; webtool: string };
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  private apiUrl = environment.apiUrl + 'roles';
  //private apiUrl = 'http://localhost:3000/roles'; 

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getRolesByWebtool(webtoolId: number): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/webtool/${webtoolId}`);
  }
  createRole(roleData: RoleData): Observable<Role> {
    const payload = {
      roles: roleData.roles,
      privileges: roleData.privileges,
      webtoolId: roleData.webtoolId
    };

    console.log('Creating role with payload:', payload);
    return this.http.post<Role>(this.apiUrl, payload);
  }

  updateRole(id: number, roleData: Omit<RoleData, 'id'>): Observable<Role> {
    const payload = {
      roles: roleData.roles,
      privileges: roleData.privileges,
      webtoolId: roleData.webtoolId
    };

    console.log('Updating role with payload:', payload);
    return this.http.put<Role>(`${this.apiUrl}/${id}`, payload);
  }  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }}
