import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


export interface PrItemPayload {
  supplier_id: number | string;
  fixed_item_id: number | string;
  qty: number;
  unit_cost: number;
  currency: string; // 'USD'
}

export interface PrCreatePayload {
  pr_code: string;
  pr_date: string;           // YYYY-MM-DD
  total_price: number;
  items: PrItemPayload[];
}

export interface PrCreateResponse {
  id: number;
  pr_code: string;
  pr_date: string;
  total_price: number;
  pr_path?: string | null;
  // ...anything else your API returns
}
export interface PrListItem {
  id: number;
  pr_code: string;
  pr_date: string;
  total_price: number;
  status?: string;
  total_items_count?: number;
  remaining_items_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrService {
  private base = `${environment.apiBaseUrl}/prs`; // e.g. /api/prs

  constructor(private http: HttpClient) {}

  /** Create PR with multipart FormData:
   *  - payload (stringified JSON)
   *  - document (file)
   */
  create(fd: FormData): Observable<PrCreateResponse> {
    // DO NOT set Content-Type; HttpClient will set the correct multipart boundary
    return this.http.post<PrCreateResponse>(this.base, fd);
  }

  /** Get list of PRs for selection */
  getPrs(): Observable<PrListItem[]> {
    return this.http.get<any>(this.base).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

getPrsForAssetCreation(): Observable<any> {
  return this.http.get(`${this.base}/prs-for-asset-creation`);
}

}
