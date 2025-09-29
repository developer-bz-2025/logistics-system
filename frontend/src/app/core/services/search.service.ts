import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


export interface TagDto { id: number; name: string; }
export interface UnitDto { id: number; unit_name: string; }
export interface EntityDto { id: number; name: string; }


export interface ResourceListItemDto {
  id: number;
  res_title: string;
  res_description?: string | null;
  res_type_id?: number | null;
  type?: string | null; // optional label from backend
  res_visibility_id?: number | null;
  visibility?: string | null; // optional label from backend
  unit?: UnitDto | null;
  entity?: EntityDto | null;
  tags?: TagDto[];
  res_url?: string | null;
  created_at?: string;
}


export interface PaginatedResponse<T> {
  data: T[];
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null };
  meta?: {
    current_page?: number;
    from?: number; to?: number; last_page?: number; path?: string; per_page?: number; total?: number;
  };
}


export interface SearchQuery {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: 'recent' | 'relevance';
  type_id?: number;
  visibility_id?: number;
  unit_id?: number;
  entity_id?: number;
  category_id?: number;
}


@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly base = `${environment.apiBaseUrl}`;

  private readonly fileBase = environment.fileBaseUrl;
  constructor(private http: HttpClient) { }


  searchResources(query: SearchQuery): Observable<PaginatedResponse<ResourceListItemDto>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<ResourceListItemDto>>(`${this.base}/resources/search`, { params });
  }
}