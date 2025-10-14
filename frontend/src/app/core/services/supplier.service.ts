import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Supplier { id: number; name: string; }



@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private base = `${environment.apiBaseUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  /** search, optional category_id, per_page (backend supports both paged and full list) */
  search(search: string, options?: { category_id?: number | string; per_page?: number }): Observable<Supplier[]> {
    let params = new HttpParams();
    if (search?.trim()) params = params.set('search', search.trim());
    if (options?.category_id != null) params = params.set('category_id', String(options.category_id));
    if (options?.per_page != null) params = params.set('per_page', String(options.per_page));

    return this.http.get<any>(this.base, { params }).pipe(
      map(resp => {
        // unwrap arrays from common Laravel shapes
        if (Array.isArray(resp)) return resp as Supplier[];
        if (Array.isArray(resp?.data)) return resp.data as Supplier[];            // paginated OR resource collection
        if (Array.isArray(resp?.data?.data)) return resp.data.data as Supplier[]; // deep-paginated
        return [];
      })
    );
  }
}
