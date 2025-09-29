// org-structure.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrgStructureResponse } from '../models/OrgStructureResponse';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class OrgStructureService {


  private readonly base = `${environment.apiBaseUrl}`;


  constructor(private http: HttpClient) {}

  get(): Observable<OrgStructureResponse> {
    return this.http.get<OrgStructureResponse>(`${this.base}/org-structure`);
  }
  
}
