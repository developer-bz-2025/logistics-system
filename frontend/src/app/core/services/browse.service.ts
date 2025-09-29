import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrowseQuery, Facets, Paginated, ResourceItem } from '../models/browse';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class BrowseService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  list(q: BrowseQuery): Observable<Paginated<ResourceItem>> {
    return this.http.get<Paginated<ResourceItem>>(`${this.base}/resources/browse`, { params: this._params(q) });
  }

  facets(q: BrowseQuery): Observable<Facets> {
    return this.http.get<Facets>(`${this.base}/resources/browse/facets`, { params: this._params(q) });
  }

  countries() { return this.http.get<Array<{id:number;name:string}>>(`${this.base}/countries`); }
  entities(country_id?: number) {
    const params = country_id ? { params: { country_id } as any } : {};
    return this.http.get<Array<{entity_id:number;entity_name:string}>>(`${this.base}/entities`, params);
  }
  units(entity_id?: number) {
    const params = entity_id ? { params: { entity_id } as any } : {};
    return this.http.get<Array<{unit_id:number;unit_name:string}>>(`${this.base}/units`, params);
  }
  types() { return this.http.get<Array<{id:number;name:string}>>(`${this.base}/resource-types`); }
  visibilities() { return this.http.get<Array<{id:number;name:string}>>(`${this.base}/visibilities`); }

  private _params(q: any): HttpParams {
    let p = new HttpParams();
    Object.entries(q || {}).forEach(([k, v]) => {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      if (Array.isArray(v)) v.forEach(val => p = p.append(k, String(val)));
      else p = p.set(k, String(v));
    });
    return p;
  }

  getDashboardOverview() {
    return this.http.get<any>(`${this.base}/dashboard/overview`);
  }
}
