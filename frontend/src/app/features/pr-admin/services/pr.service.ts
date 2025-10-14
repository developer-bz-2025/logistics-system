import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PrListResponse, PrRow, PrItem } from '../models/pr';

@Injectable({
  providedIn: 'root'
})
export class PrService {

  private base = `${environment.apiBaseUrl}/prs`;

  constructor(private http: HttpClient) {}

  list(options?: { search?: string; page?: number; per_page?: number; include?: string }): Observable<PrListResponse> {
    let params = new HttpParams();
    if (options?.search)   params = params.set('search', options.search);
    if (options?.page)     params = params.set('page', String(options.page));
    if (options?.per_page) params = params.set('per_page', String(options.per_page));
    if (options?.include)  params = params.set('include', options.include);
  
    return this.http.get<any>(this.base, { params }).pipe(
      map(resp => {
        // Laravel paginator shape: { data: [...], meta: {...}, links: {...} }
        const data: PrRow[] = Array.isArray(resp?.data)
          ? resp.data
          : (Array.isArray(resp?.data?.data) ? resp.data.data : []);
  
        const meta = resp?.meta ?? {};
        const total        = meta.total        ?? resp?.total        ?? data.length;
        const current_page = meta.current_page ?? resp?.current_page ?? 1;
        const last_page    = meta.last_page    ?? resp?.last_page    ?? 1;
        const per_page     = meta.per_page     ?? resp?.per_page     ?? data.length;
  
        // normalize date + document_url (optional)
        const norm = data.map(r => ({
          ...r,
          pr_date: typeof r.pr_date === 'string' ? r.pr_date.slice(0, 10) : r.pr_date,
          document_url: r.pr_path && String(r.pr_path).startsWith('/')
            ? (location.origin + r.pr_path)
            : r.pr_path
        }));
  
        return { data: norm, total, current_page, last_page, per_page };
      })
    );
  }

  download(prId: number) {
    return this.http.get(`${this.base}/${prId}/document`, {
      responseType: 'blob' as const
    });
  }
  
  

  /** Fallback to fetch items for a specific PR if list doesn't include them */
  getItems(prId: number): Observable<PrItem[]> {
    return this.http.get<any>(`${this.base}/${prId}/items`).pipe(
      map(r =>
        Array.isArray(r) ? r :
        Array.isArray(r?.data) ? r.data :
        Array.isArray(r?.items) ? r.items :
        []
      )
    );
  }
  
}
