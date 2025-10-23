import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Paged, PrEditRequestRow, ApiDetailResponse} from './models';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

// import {
//   PrEditRequestDetail,
//   PrEditRequestRow,
//   PrEditRequestStatus,
// } from './models';

interface PageMeta { current_page: number; per_page: number; total: number; }
// interface Paged<T> { data: T[]; meta: PageMeta; }



export interface FixedItem { id: number; code?: string; name: string; sub_category_id?: number; unit?: string; }


@Injectable({ providedIn: 'root' })
export class PrEditRequestsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl ?? '/api';

  private fixedItemsMap$?: Observable<Record<number, string>>;


  list(opts: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    let params = new HttpParams();
    if (opts.status && opts.status !== 'all') params = params.set('status', opts.status);
    if (opts.search) params = params.set('search', opts.search);
    if (opts.page) params = params.set('page', String(opts.page));
    if (opts.per_page) params = params.set('per_page', String(opts.per_page));
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.order) params = params.set('order', opts.order);

    return this.http.get<Paged<PrEditRequestRow>>(`${this.base}/pr-edit-requests`, { params });
  }

  // getOne(id: number) {
  //   return this.http.get<PrEditRequestDetail>(`${this.base}/pr-edit-requests/${id}`);
  // }

  // approve(id: number) {
  //   return this.http.post<{ message: string }>(`${this.base}/pr-edit-requests/${id}/approve`, {});
  // }

  // reject(id: number, reason?: string) {
  //   return this.http.post<{ message: string }>(`${this.base}/pr-edit-requests/${id}/reject`, { reason });
  // }

  getOne(id: number) {
    return this.http.get<ApiDetailResponse>(`${this.base}/pr-edit-requests/${id}`);
  }
  
  approve(id: number) {
    return this.http.post<{ message: string }>(`${this.base}/pr-edit-requests/${id}/approve`, {});
  }
  
  reject(id: number, reason?: string) {
    return this.http.post<{ message: string }>(`${this.base}/pr-edit-requests/${id}/reject`, { reason });
  }

  getFixedItemsMap(): Observable<Record<number, string>> {
    if (!this.fixedItemsMap$) {
      const params = new HttpParams().set('per_page', '1000'); // adjust if needed
      this.fixedItemsMap$ = this.http.get<{ data: FixedItem[] }>(`${this.base}/fixed-items`, { params }).pipe(
        map(res => (res?.data || []).reduce((acc, it) => {
          acc[it.id] = it.name || `Item #${it.id}`;
          return acc;
        }, {} as Record<number, string>)),
        shareReplay(1),
      );
    }
    return this.fixedItemsMap$;
  }
  
}
