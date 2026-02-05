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

  // Get dynamic attributes based on category, with options filtered by sub-category
  getCategoryAttributes(categoryId: number, subCategoryId?: number): Observable<any> {
    let params = new HttpParams();
    if (subCategoryId) {
      params = params.set('sub_category_id', String(subCategoryId));
    }
    return this.http.get<any>(`${this.apiUrl}/categories/${categoryId}/attributes`, { params }).pipe(
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

  getLogAdminStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/log-admin-stats`);
  }


  // Get single asset details
  getAsset(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/items/${id}`);
  }

  // Update asset
  updateAsset(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/items/${id}`, data);
  }

  // Update asset photo only
  updateAssetPhoto(id: number, photoFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photoFile);
    return this.http.post<any>(`${this.apiUrl}/items/${id}/photo`, formData);
  }

  // Create new asset
  createAsset(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/items`, data);
  }

  // Request to move asset to a new location
  moveAsset(itemId: number, requestedLocationId: number, notes?: string): Observable<any> {
    const payload: any = {
      item_id: itemId,
      requested_location_id: requestedLocationId
    };
    if (notes?.trim()) {
      payload.notes = notes.trim();
    }
    return this.http.post<any>(`${this.apiUrl}/location-change-requests`, payload);
  }

  // Get asset history/lifecycle
  getAssetHistory(itemId: number, page: number = 1, perPage: number = 15): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('per_page', String(perPage));
    return this.http.get<any>(`${this.apiUrl}/items/${itemId}/history`, { params });
  }
}
