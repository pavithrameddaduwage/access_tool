import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';



interface ValueType {
  id: number;
  valuetype: string;
}


@Injectable({
  providedIn: 'root'
})
export class ValuetypeService {

   //private apiUrl = 'http://localhost:3000/valuetype'; 
   private apiUrl = environment.apiUrl + 'valuetype';

    
      constructor(private http : HttpClient) {}
    
      getValueTypes(): Observable<ValueType[]> {
        return this.http.get<ValueType[]>(this.apiUrl);
      }
    
      creatValueType(valuetype: { valuetype: string }): Observable<ValueType> {
        return this.http.post<ValueType>(this.apiUrl, valuetype);
      }
      
    
      updateValueType(id: number, valuetype: ValueType): Observable<ValueType> {
        return this.http.put<ValueType>(`${this.apiUrl}/${id}`, valuetype);
      }
    
      deleteValueType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
      }
}
