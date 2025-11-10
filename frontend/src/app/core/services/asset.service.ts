import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateAssetPayload {
  fixed_item_id: number;
  supplier_id?: number;
  brand_id?: number;
  color_id?: number;
  pr_id?: number;
  acquisition_cost: number;
  acquisition_date?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  location_id?: number;
  floor_id?: number;
  holder_user_id?: number;
  status_id?: number;
  description?: string;
  notes?: string;
  budget_code?: string;
  budget_donor?: string;
  attributes: { att_id: number; att_option_id: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  private base = `${environment.apiBaseUrl}/items`;

  constructor(private http: HttpClient) {}

  create(payload: CreateAssetPayload): Observable<any> {
    return this.http.post(this.base, payload);
  }
}
