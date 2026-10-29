import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { ItemEditRequestDetail, PagedItemEditRequests } from './models';

@Injectable({ providedIn: 'root' })
export class ItemEditRequestsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl ?? '/api';

  list(opts: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
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

    return this.http.get<PagedItemEditRequests>(`${this.base}/item-edit-requests`, { params });
  }

  getOne(id: number) {
    return this.http.get<{ data: ItemEditRequestDetail }>(`${this.base}/item-edit-requests/${id}`);
  }

  approve(id: number) {
    return this.http.post<{ message: string }>(`${this.base}/item-edit-requests/${id}/approve`, {});
  }

  reject(id: number, reason?: string) {
    return this.http.post<{ message: string }>(`${this.base}/item-edit-requests/${id}/reject`, { reason });
  }
}
