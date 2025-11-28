import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LocationOption {
  id: number;
  name: string;
  code?: string;
  country?: string;
}

export interface LogAdminCandidate {
  id: number;
  name: string;
  email: string;
  role?: { name: string };
  locations?: LocationOption[];
}

export interface UserDetail extends LogAdminCandidate {
  employee_no?: string;
  locations: LocationOption[];
}

@Injectable({ providedIn: 'root' })
export class LogAdminAssignmentsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl ?? '/api';

  searchCandidates(search?: string, limit = 20): Observable<LogAdminCandidate[]> {
    let params = new HttpParams().set('limit', limit);
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<{ data?: LogAdminCandidate[] } | LogAdminCandidate[]>(
        `${this.baseUrl}/super-admin/log-admin-candidates`,
        { params }
      )
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  getAssignedAdmins(): Observable<LogAdminCandidate[]> {
    return this.http
      .get<{ data?: LogAdminCandidate[] } | LogAdminCandidate[]>(
        `${this.baseUrl}/super-admin/log-admins`
      )
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  fetchLocations(): Observable<LocationOption[]> {
    return this.http
      .get<{ data?: LocationOption[] } | LocationOption[]>(`${this.baseUrl}/locations`)
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  assign(userId: number, locationIds: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/super-admin/log-admin-assignments`, {
      user_id: userId,
      location_ids: locationIds,
    });
  }

  getUserDetail(id: number): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.baseUrl}/users/${id}`);
  }
}