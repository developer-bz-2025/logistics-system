import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface EntityDto {
  entity_id: number;
  entity_name: string;
  entity_description?: string | null;
  }


@Injectable({
  providedIn: 'root'
})
export class EntityService {

 
  private readonly apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http:HttpClient) { }

  createEntity(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/entities`, data);
  }

  editEntity(id: any,data:Partial<EntityDto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/entities/${id}`,data);
  }

  getEntities(){
    return this.http.get(`${this.apiUrl}/entities`);
  }

  entityDetails(id:number){
    return this.http.get(`${this.apiUrl}/entities/${id}`);
  }
}
