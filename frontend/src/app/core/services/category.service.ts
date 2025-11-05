// src/app/core/services/category.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category, SubCategory, FixedItem, PagedResult, AssetListItem } from '../models/reference';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}

  private readonly apiUrl = `${environment.apiBaseUrl}`;


  getCategories(): Observable<Category[]> {
    // backend may return { data: [...] } or the plain array. Normalize both shapes.
    return this.http.get<any>(`${this.apiUrl}/categories`).pipe(
      map((res: any) => {
        if (!res) return [];
        return Array.isArray(res) ? res : res.data || [];
      })
    );
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }
  getSubCategories(catId: number): Observable<SubCategory[]> {
    return this.http.get<any>(`${this.apiUrl}/categories/${catId}/sub-categories`).pipe(
      map((res: any) => {
        if (!res) return [];
        return Array.isArray(res) ? res : res.data || [];
      })
    );
  }
  getFixedItems(subId: number): Observable<FixedItem[]> {
    return this.http.get<any>(`${this.apiUrl}/sub-categories/${subId}/fixed-items`).pipe(
      map((res: any) => {
        if (!res) return [];
        return Array.isArray(res) ? res : res.data || [];
      })
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  listAssets(q: {
    page?: number; pageSize?: number; search?: string;
    category_id?: number; sub_category_id?: number; fixed_item_id?: number;
    status_id?: number; location_id?: number; floor_id?: number;
    supplier_id?: number; holder_user_id?: number;
    sort?: string; dir?: 'asc' | 'desc';
    // Dynamic attribute filters will be passed as well (e.g., material_id, size, etc.)
    [key: string]: any;
  }): Observable<PagedResult<AssetListItem>> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PagedResult<AssetListItem>>(`${this.apiUrl}/items`, { params });
  }

  // Get dynamic attributes based on category
  getCategoryAttributes(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories/${categoryId}/attributes`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  // Fetch all statuses
  getStatuses(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/statuses`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  // Fetch all locations
  getLocations(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/locations`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  // Fetch all floors
  getFloors(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/floors`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  // Fetch all suppliers
  getSuppliers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/suppliers`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  // Fetch all users for holder filter
  getUsers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/users`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  // Fetch dashboard statistics (asset counts by category)
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }
}
