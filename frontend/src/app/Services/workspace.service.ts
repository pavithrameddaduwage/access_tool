import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


interface Workspace {
  id: number;
  workspace: string;
}


@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

//private apiUrl = 'http://localhost:3000/workspace'; 
private apiUrl = environment.apiUrl + 'workspace';

    constructor(private http : HttpClient) {}
  
    getWorkspaces(): Observable<Workspace[]> {
      return this.http.get<Workspace[]>(this.apiUrl);
    }
  
    createWorkspace(workspace: Workspace): Observable<Workspace> {
      return this.http.post<Workspace>(this.apiUrl, workspace);
    }
  
    updateWorkspace(id: number, workspace: Workspace): Observable<Workspace> {
      return this.http.put<Workspace>(`${this.apiUrl}/${id}`, workspace);
    }
  
    deleteWorkspace(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
  }
