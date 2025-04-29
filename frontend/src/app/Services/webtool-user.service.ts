import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebtoolUser, UserRole } from '../../../interfaces/webtool.interfaces';
import { environment } from '../../environments/environment';
// THIS IS WEBTOOL-USER.SERVICE.TS


@Injectable({
  providedIn: 'root'
})
export class WebtoolUserService {
  //private apiUrl = 'http://localhost:3000/webtool-user';
  private apiUrl = environment.apiUrl + 'webtool-user';

  constructor(private http: HttpClient) {}

  getRecords(): Observable<WebtoolUser[]> {
    return this.http.get<WebtoolUser[]>(this.apiUrl);
  }

  createRecord(userId: number, webtoolId: number, roleIds: number[]): Observable<any> {
    return this.http.post(this.apiUrl, { userId, webtoolId, roleIds });
  }

  updateRecord(userId: number, webtoolId: number, roleIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/${webtoolId}`, { roleIds });
  }

  deleteRecord(userId: number, webtoolId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/${webtoolId}`);
  }
}