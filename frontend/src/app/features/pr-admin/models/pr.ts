export interface PrItem {
  pr_item_id:number;
  supplier_id: number;
  fixed_item_id: number;
  qty: number;
  unit_cost: number;
  currency: string;
  // Optional denormalized labels if your API sends them
  supplier_name?: string;
  fixed_item_name?: string;
  fixed_item?:string,
  category_id:number;
  sub_category_id: number;
}


export interface PrRow {
  id: number;
  pr_code: string;
  pr_date: string;          // 'YYYY-MM-DD'
  total_price: number;
  pr_path?: string | null;  // storage path or url
  supplier_name?: string;   // if you have one dominant supplier per PR (optional)
  items?: PrItem[];         // include if API returns items in list
}

export interface PrListResponse {
  data: PrRow[];
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}
