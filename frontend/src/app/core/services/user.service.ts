import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { JwtService } from 'src/app/core/services/jwt.service';

import {  catchError } from 'rxjs/operators';


export interface UnitUserLite {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  total:number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  meta: { total: number; per_page: number; current_page: number; last_page: number };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly apiUrl = `${environment.apiBaseUrl}/users`;


    constructor(private http:HttpClient,private jwtService: JwtService) { }

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  updateUser(data:any):Observable<any>{
    return this.http.put(`${this.apiUrl}/${data.id}`,data);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getAssignedUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/assigned-users`);
  }

  getUser(id:number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getUserRole(): Observable<string | null> {
    const userId = this.jwtService.getUserId();

    if (!userId) return of(null);

    return this.getUser(Number(userId)).pipe(
      map(user => user?.role ?? null),
      catchError(err => {
        console.error('Error fetching user role:', err);
        return of(null);
      })
    );
  }

  
  getUnitUsers(unitId: any, opts?: { search?: string; page?: number; per_page?: number }) {
    const params: any = { unit_id: unitId, ...opts };
    return this.http.get<Paginated<UnitUserLite>>(`${this.apiUrl}/unit-admin/users`, { params });
  }

  search(search: string, options?: { per_page?: number }): Observable<{ id: number; name: string }[]> {
    let params = new HttpParams();
    if (search?.trim()) params = params.set('search', search.trim());
    if (options?.per_page != null) params = params.set('per_page', String(options.per_page));

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(resp => {
        if (Array.isArray(resp)) return resp as { id: number; name: string }[];
        if (Array.isArray(resp?.data)) return resp.data as { id: number; name: string }[];
        if (Array.isArray(resp?.data?.data)) return resp.data.data as { id: number; name: string }[];
        return [];
      })
    );
  }
  
  countUnitUsers(unitId: number) {
    return this.http.get<{ total_users: number }>(`${this.apiUrl}/unit-admin/users/count`, { params: { unit_id: unitId } })
      .pipe(map(r => r?.total_users ?? 0));
  }

}
