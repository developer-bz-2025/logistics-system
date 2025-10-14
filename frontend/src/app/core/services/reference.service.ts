import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Category, SubCategory, FixedItem } from '../models/reference';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReferenceService {

  private base = environment.apiBaseUrl;

  private categories$?: Observable<Category[]>;
  private subcatsCache = new Map<number, Observable<SubCategory[]>>();
  private itemsCache = new Map<number, Observable<FixedItem[]>>();

  constructor(private http: HttpClient) {}

    /** Safely normalize API list responses to T[] */
    private unwrapArray<T>(resp: any): T[] {
      // Common shapes: [], {data: []}, {items: []}, {results: []}, {payload: []}
      if (Array.isArray(resp)) return resp as T[];
      if (Array.isArray(resp?.data)) return resp.data as T[];
      if (Array.isArray(resp?.items)) return resp.items as T[];
      if (Array.isArray(resp?.results)) return resp.results as T[];
      if (Array.isArray(resp?.payload)) return resp.payload as T[];
      // Sometimes Laravel paginated: { data: { data: [] } }
      if (Array.isArray(resp?.data?.data)) return resp.data.data as T[];
      console.warn('[ReferenceService] Unexpected list shape:', resp);
      return [];
    }

    private toOptions<T extends { id: number; name?: string; label?: string }>(rows: T[]) {
      return rows.map(r => ({ id: r.id, label: (r as any).name ?? (r as any).label ?? String(r.id) }));
    }
  
    getCategories(): Observable<Category[]> {
      if (!this.categories$) {
        this.categories$ = this.http
          .get<any>(`${this.base}/categories`)
          .pipe(
            map(resp => this.unwrapArray<Category>(resp)),
            shareReplay({ bufferSize: 1, refCount: true })
          );
      }
      return this.categories$;
    }
  
    getSubCategories(categoryId: number): Observable<SubCategory[]> {
      if (!this.subcatsCache.has(categoryId)) {
        const req$ = this.http
          .get<any>(`${this.base}/categories/${categoryId}/sub-categories`)
          .pipe(
            map(resp => this.unwrapArray<SubCategory>(resp)),
            shareReplay({ bufferSize: 1, refCount: true })
          );
        this.subcatsCache.set(categoryId, req$);
      }
      return this.subcatsCache.get(categoryId)!;
    }
  
    getFixedItems(subCategoryId: number): Observable<FixedItem[]> {
      if (!this.itemsCache.has(subCategoryId)) {
        const req$ = this.http
          .get<any>(`${this.base}/sub-categories/${subCategoryId}/fixed-items`)
          .pipe(
            map(resp => this.unwrapArray<FixedItem>(resp)),
            shareReplay({ bufferSize: 1, refCount: true })
          );
        this.itemsCache.set(subCategoryId, req$);
      }
      return this.itemsCache.get(subCategoryId)!;
    }
  
    /** Expose option mappers if you still want them in the component */
    asOptions = this.toOptions.bind(this);
}
