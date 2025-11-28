import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export type ReferenceType = 'locations' | 'brands' | 'suppliers' | 'floors';

export interface ReferenceItem {
  id: number;
  name: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class ReferencesService {
  private baseUrl = environment.apiBaseUrl ?? '/api';

  constructor(private http: HttpClient) {}

  list(type: ReferenceType): Observable<ReferenceItem[]> {
    return this.http
      .get<{ data?: ReferenceItem[] } | ReferenceItem[]>(`${this.baseUrl}/${type}`)
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  create(type: ReferenceType, payload: { name: string }): Observable<ReferenceItem> {
    return this.http.post<ReferenceItem>(`${this.baseUrl}/${type}`, payload);
  }

  update(type: ReferenceType, id: number, payload: { name: string }): Observable<ReferenceItem> {
    return this.http.put<ReferenceItem>(`${this.baseUrl}/${type}/${id}`, payload);
  }

  delete(type: ReferenceType, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${type}/${id}`);
  }
}

