import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface LocationChangeRequest {
  id: number;
  item: {
    id: number;
    fixed_item_name: string;
    description: string;
    sn: string | null;
  };
  current_location: {
    id: number;
    name: string;
  };
  requested_location: {
    id: number;
    name: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  requested_by: {
    id: number;
    name: string;
    email: string;
  };
  approved_by: {
    id: number;
    name: string;
    email: string;
  } | null;
  request_date: string;
  approval_date: string | null;
  notes: string | null;
}

export interface LocationChangeRequestsResponse {
  data: LocationChangeRequest[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

@Injectable({ providedIn: 'root' })
export class LocationChangeRequestsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl ?? '/api';

  list(opts: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Observable<LocationChangeRequestsResponse> {
    let params = new HttpParams();
    if (opts.status && opts.status !== 'all') {
      params = params.set('status', opts.status);
    }
    if (opts.search) {
      params = params.set('search', opts.search);
    }
    if (opts.page) {
      params = params.set('page', String(opts.page));
    }
    if (opts.per_page) {
      params = params.set('per_page', String(opts.per_page));
    }

    return this.http.get<LocationChangeRequestsResponse>(`${this.base}/location-change-requests`, { params });
  }

  approve(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/location-change-requests/${id}/approve`, {});
  }

  reject(id: number, reason?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/location-change-requests/${id}/reject`, { reason });
  }
}

