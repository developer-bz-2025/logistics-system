// core/services/resources.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs';

export interface ResType { id: number; type: 'Document' | 'Policy' | 'System Link' | 'Useful Link'; }
export interface ResVisibility { id: number; type: 'Internal' | 'Public' | 'Global' | 'Confidential'; }
export interface ResCategory { id: number; name: string; type_id?: number }
export interface UnitDashboardStats {
  totals: {
    total_resources: number;
  };
  byType: Array<{ type: string; count: number }>;
  byVisibility: Array<{ visibility: string; count: number }>;
}

export interface ResourceLite {
  res_id: number;
  res_title: string;
  res_description: string | null;
  res_visibility_id: number;
  visibility: string;
  res_url: string | null;
  uploaded_by: number;
  created_at: string;      // ISO
}

export interface CategoryNode {
  category_id: number | null;
  category_name: string;
  resources: ResourceLite[];
}

export interface TypeNode {
  type_id: number;
  type: string;            // 'Document' | 'Policy' | ...
  categories: CategoryNode[];
}


@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private readonly base = `${environment.apiBaseUrl}`;

  private readonly fileBase = environment.fileBaseUrl;

  // resolveUrl(u: string | null | undefined): string | null {
  //   if (!u) return null;

  //   // already absolute (http/https) → keep as-is (system/useful links)
  //   if (/^https?:\/\//i.test(u)) return u;

  //   // common Laravel public paths we want to map to fileBase
  //   // API should ideally return '/storage/resources/..' (see backend steps below)
  //   if (u.startsWith('/storage/') || u.startsWith('storage/')) {
  //     const rel = u.replace(/^\/+/, '');                 // strip leading slash
  //     return `${this.fileBase}/${rel}`;
  //   }

  //   // fallback: if backend (incorrectly) returns 'storage/app/public/...'
  //   if (u.includes('storage/app/public/')) {
  //     const rel = u.replace(/^\/+/, '').replace('storage/app/public/', 'storage/');
  //     return `${this.fileBase}/${rel}`;
  //   }

  //   // last resort: join as relative to fileBase
  //   const base = this.fileBase.replace(/\/+$/, '');
  //   const rel = String(u).replace(/^\/+/, '');
  //   return `${base}/${rel}`;
  // }

// resources.service.ts
resolveUrl(u: string | null | undefined): string | null {
  if (!u) return null;

  const base = (environment.fileBaseUrl || window.location.origin).toString();
  const baseClean = base.replace(/\/+$/, ''); // strip trailing slash
  const s = String(u).trim().replace(/\\/g, '/'); // normalize backslashes

  // Try to parse as absolute URL, fallback to relative
  try {
    const url = new URL(s, baseClean); // handles absolute or makes it absolute against base
    let path = url.pathname;

    // Normalize common Laravel paths
    // /storage/app/public/...  -> /storage/...
    path = path.replace(/^\/storage\/app\/public\//i, '/storage/');

    // /resources/...           -> /storage/resources/...
    if (/^\/resources\//i.test(path)) {
      path = path.replace(/^\/resources\//i, '/storage/resources/');
    }

    // Already correct? leave it
    // Ensure single leading slash
    path = '/' + path.replace(/^\/+/, '');

    url.pathname = path;
    return url.toString();
  } catch {
    // Not a valid absolute URL -> treat as relative path and normalize
    let rel = s
      .replace(/^\/?storage\/app\/public\//i, 'storage/')
      .replace(/^\/?resources\//i, 'storage/resources/')
      .replace(/^\/+/, ''); // no leading slashes

    return `${baseClean}/${rel}`;
  }
}



  constructor(private http: HttpClient) { }

  getTypes() { return this.http.get<ResType[]>(`${this.base}/resource-types`); }
  getVisibilities() { return this.http.get<ResVisibility[]>(`${this.base}/visibilities`); }

  searchCategories(q: string, typeId?: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (typeId) params.set('type_id', String(typeId));
    return this.http.get<ResCategory[]>(`${this.base}/resource-categories?${params.toString()}`);
  }

  getUnitDashboard(unitId: number) {
    return this.http.get<UnitDashboardStats>(`${this.base}/resources/dashboard?unit_id=${unitId}`);
  }

  getResourcesTree(unitId: number) {
    return this.http.get<TypeNode[]>(`${this.base}/resources/tree`, {
      params: { unit_id: unitId }
    });
  }

  resourceBrowse(unitId: number) {
    return this.http.get<TypeNode[]>(`${this.base}/resources/browse-tree`, {
      params: { unit_id: unitId }
    });
  }

/** Browse: get resource tree by scope (server enforces role rules). */
getResourcesTreeByScope(country_id: number, entity_id: number, unit_id?: number) {
  let params = new HttpParams() 
    .set('country_id', String(country_id))
    .set('entity_id', String(entity_id));

  if (unit_id != null) {
    params = params.set('unit_id', String(unit_id));
  }

  return this.http.get<TypeNode[]>(`${this.base}/resources/tree`, { params });
}

/** Optional: object-shaped helper if you prefer calling with a scope object */
getResourcesTreeByScopeObj(scope: { country_id: number; entity_id: number; unit_id?: number }) {
  return this.getResourcesTreeByScope(scope.country_id, scope.entity_id, scope.unit_id);
}

/** Simple lookups (normalize to {id,name}) */
getCountries() {
  return this.http.get<any[]>(`${this.base}/countries`)
    .pipe(map(list => list.map(c => ({ id: c.id ?? c.country_id, name: c.name ?? c.country_name }))));
}

getEntities(country_id?: number) {
  const params: any = {};
  if (country_id) params.country_id = country_id;
  return this.http.get<any[]>(`${this.base}/browse-entities`, { params })
    .pipe(map(list => list.map(e => ({ id: e.id ?? e.entity_id, name: e.name ?? e.entity_name }))));
}

getUnits(entity_id?: number, country_id?: number) {
  const params: any = {};
  if (entity_id)  params.entity_id  = entity_id;
  if (country_id) params.country_id = country_id; // backend may ignore
  return this.http.get<any[]>(`${this.base}/browse-units`, { params })
    .pipe(map(list => list.map(u => ({ id: u.id ?? u.unit_id, name: u.name ?? u.unit_name }))));
}


  // Sends either FormData (if file) or JSON (no file)
  create(payload: {
    res_title: string;
    res_description: string;
    res_type_id: number;
    res_visibility_id: number;
    unit_id: number;
    res_uploaded_by: number;
    tags: string[] | number[];
    category?: string;
    // for System/Useful Link:
    res_url?: string;   // <-- confirm the exact key name with your backend
    file?: File | null;
  }) {
    const hasFile = !!payload.file;
    if (hasFile) {
      const fd = new FormData();

      // append scalars
      fd.append('res_title', payload.res_title);
      fd.append('res_description', payload.res_description);
      fd.append('res_type_id', String(payload.res_type_id));
      fd.append('res_visibility_id', String(payload.res_visibility_id));
      fd.append('unit_id', String(payload.unit_id));
      fd.append('res_uploaded_by', String(payload.res_uploaded_by));
      if (payload.category) fd.append('category', payload.category);
      if (payload.res_url) fd.append('res_url', payload.res_url);

      // append tags as an array (tags[])
      for (const t of payload.tags ?? []) {
        fd.append('tags[]', String(t)); // <-- key change
      }

      // append file last
      if (payload.file) fd.append('file', payload.file);

      return this.http.post(`${this.base}/resources`, fd);
    } else {
      const body: any = { ...payload };
      delete body.file;
      return this.http.post(`${this.base}/resources`, body);
    }
  }
}
