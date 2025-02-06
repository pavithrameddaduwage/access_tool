import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Webtool } from '../../../interfaces/webtool.interfaces';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class WebtoolService {

//private apiUrl = 'http://localhost:3000/webtool'; 
private apiUrl = environment.apiUrl + 'webtool';

  
    constructor(private http : HttpClient) {}
  
    getWebtools(): Observable<Webtool[]> {
      return this.http.get<Webtool[]>(this.apiUrl);
    }
  
    createWebtool(webtool: Webtool): Observable<Webtool> {
      return this.http.post<Webtool>(this.apiUrl, webtool);
    }
  
    updateWebtool(id: number, webtool: Webtool): Observable<Webtool> {
      return this.http.put<Webtool>(`${this.apiUrl}/${id}`, webtool);
    }

    getWebtoolById(id: number): Observable<Webtool> {
      return this.http.get<Webtool>(`${this.apiUrl}/${id}`);
    }
  
    deleteWebtool(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
  }
