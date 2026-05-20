import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


interface Type {
  id: number;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class TypeService {

  //private apiUrl = 'http://localhost:3000/type'; 
  private apiUrl = environment.apiUrl + 'type';
  
    constructor(private http : HttpClient) {}
  
    getTypes(): Observable<Type[]> {
      return this.http.get<Type[]>(this.apiUrl);
    }
  
    createType(type: Type): Observable<Type> {
      return this.http.post<Type>(this.apiUrl, type);
    }
  
    updateType(id: number, type: Type): Observable<Type> {
      return this.http.put<Type>(`${this.apiUrl}/${id}`, type);
    }
  
    deleteType(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
