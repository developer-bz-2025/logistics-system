import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  
}
