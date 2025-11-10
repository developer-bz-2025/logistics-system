export interface Category { id: number; name: string; }
export interface SubCategory { id: number; name: string; category_id: number; }
export interface FixedItem { id: number; name: string; sub_category_id: number; }

export interface Supplier { id: number; name: string; }


export type SelectOption = { id: number | string; value: string };

export interface AssetListItem {
    id: number;
    sn?: string; // serial number
    fixed_item_id: number;
    fixed_item_name: string;    // backend: join of fixed_items
    description?: string;
    category_name: string;      // convenient from API
    sub_category_name: string;  // convenient from API
    status_id?: number;
    status_name?: string;
    location_id?: number;
    location_name?: string;
    floor_id?: number;
    floor_name?: string;
    supplier_id?: number;
    supplier_name?: string;
    brand_id?: number;
    brand_name?: string;
    color_id?: number;
    color_name?: string;
    holder_user_id?: number;
    holder_name?: string;
    acquisition_date?: string;
    acquisition_cost?: number;
    created_at: string;
    // Dynamic attributes based on category
    attributes?: { [key: string]: any };
  }

export interface DynamicAttribute {
  name: string;          // e.g., "Material", "Size", "Capacity"
  field_name: string;    // e.g., "material_id", "size", "capacity"
  type: 'select' | 'text' | 'number';
  options?: SelectOption[];  // For select type
}

export interface Floor { id: number; name: string; }
export interface Status { id: number; name: string; }
export interface Location { id: number; name: string; }
export interface Brand { id: number; name: string; }
  
  export interface PagedResult<T> {
    data: T[];
    total: number;
    page: number;      // 1-based
    pageSize: number;
  }
