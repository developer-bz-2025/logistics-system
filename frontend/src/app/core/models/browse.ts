// Models for Browse Resources

export interface BrowseQuery {
    country_id?: number;
    entity_id?: number;
    unit_id?: number;
    type_id?: number[];        // multi
    visibility_id?: number[];  // multi
    tags?: string[];
    search?: string;
    date_from?: string; // YYYY-MM-DD
    date_to?: string;   // YYYY-MM-DD
    page?: number;
    per_page?: number;
    sort?: string;      // e.g. '-created_at'
  }
  
  export interface ResourceItem {
    res_id: number;
    res_title: string;
    res_description?: string | null;
    res_type_id: number;
    type: string;
    visibility_id: number;
    visibility: string;
    country_id: number;
    entity_id: number;
    unit_id: number;
    category_id?: number | null;
    tags?: string[];
    res_url?: string | null;
    created_at: string; // ISO
  }
  
  export interface Paginated<T> {
    data: T[];
    meta: { total: number; per_page: number; current_page: number; last_page: number };
  }
  
  export interface Facets {
    types: Array<{ id:number; name:string; count:number }>;
    visibilities: Array<{ id:number; name:string; count:number }>;
    countries: Array<{ id:number; name:string }>;
    entities: Array<{ id:number; name:string }>;
    units: Array<{ id:number; unit_name:string }>;
    tags: Array<{ name:string; count:number }>;
  }
  