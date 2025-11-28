import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LogAdminAsset {
  id: number;
  sn?: string;
  name?: string;
  fixed_item?: string;
  fixed_item_name?: string;
  status?: { id: number; name: string };
  status_id?: number;
  location?: { id: number; name: string };
  acquisition_date?: string;
  brand?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; per_page: number; total: number };
}

@Injectable({ providedIn: 'root' })
export class LogAdminAssetsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl ?? '/api';

  getAssets(params: {
    search?: string;
    status_id?: number;
    per_page?: number;
    page?: number;
    sort?: string;
    dir?: 'asc' | 'desc';
  } = {}): Observable<Paginated<LogAdminAsset>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<Paginated<LogAdminAsset>>(`${this.baseUrl}/log-admin/assets`, {
      params: httpParams,
    });
  }

  getAllAssets(): Observable<LogAdminAsset[]> {
    return this.getAssets({ per_page: 1000 }).pipe(map(res => res.data || []));
  }
}

