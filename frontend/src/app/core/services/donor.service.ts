import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Donor, DonorListItem } from '../models/donor.model';

@Injectable({
  providedIn: 'root'
})
export class DonorService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl ?? '/api';

  /**
   * Get all donors (finance role only)
   */
  getDonors(): Observable<Donor[]> {
    return this.http.get<{ data: Donor[] }>(`${this.apiUrl}/finance/donors`).pipe(
      map(res => res.data || [])
    );
  }

  /**
   * Get single donor by ID
   */
  getDonor(id: number): Observable<Donor> {
    return this.http.get<Donor>(`${this.apiUrl}/finance/donors/${id}`);
  }

  /**
   * Create new donor
   */
  createDonor(donor: Partial<Donor>): Observable<Donor> {
    return this.http.post<Donor>(`${this.apiUrl}/finance/donors`, donor);
  }

  /**
   * Update donor
   */
  updateDonor(id: number, donor: Partial<Donor>): Observable<Donor> {
    return this.http.put<Donor>(`${this.apiUrl}/finance/donors/${id}`, donor);
  }

  /**
   * Delete donor
   */
  deleteDonor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/finance/donors/${id}`);
  }

  /**
   * Get donors list for asset creation dropdown (log_admin)
   */
  getDonorsForAssetCreation(): Observable<DonorListItem[]> {
    return this.http.get<{ data: DonorListItem[] }>(`${this.apiUrl}/donors-for-asset-creation`).pipe(
      map(res => res.data || [])
    );
  }
}
