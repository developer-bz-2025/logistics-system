export type PrEditRequestStatus = 'pending' | 'approved' | 'rejected' | string;

export interface RequestedBy {
  id: number;
  name: string;
  email: string;
}

export interface HeaderDiffs {
  pr_code: { old: string | null; new: string | null };
  acquisition_date: { old: string | null; new: string | null }; // ISO
  pr_path: {
    old: string | null;
    old_url?: string | null;
    new: string | null;
    new_url?: string | null;
  };
  total_price: { old: number | null; new: number | null };
}

export interface PrEditRequestRow {
  id: number;
  status: string; // backend returns "Pending" with capital P
  request_date: string; // ISO
  requested_by: RequestedBy;
  approved_by_admin_id: number | null;
  header_diffs: HeaderDiffs;
}

export interface PageMeta {
  // your backend sometimes returns arrays like [1,1], so accept both
  current_page?: number | number[];
  last_page?: number | number[];
  per_page?: number | number[];
  total?: number | number[];
  from?: number;
  to?: number;
  path?: string;
  links?: Array<{ url: string | null; label: string; page: number | null; active: boolean }>;
}

export interface Paged<T> {
  data: T[];
  links?: any;
  meta?: PageMeta;
}


export interface PrHeaderDiffs {
  pr_code: { old: string | null; new: string | null };
  acquisition_date: { old: string | null; new: string | null };
  total_price: { old: number | null; new: number | null };
  pr_path: { old: string | null; new: string | null; old_url?: string | null; new_url?: string | null };
}

export type ItemAction = 'add' | 'delete' | 'update_supplier' | 'update_cost' | string;

export interface ItemDiff {
  id: number;
  pr_item_id: number | null;
  action: ItemAction;
  old_supplier_id: number | null;
  old_supplier: string | null;
  new_supplier_id: number | null;
  new_supplier: string | null;
  item_name?: string | null;
  old_item_name?: string | null;
  new_item_name?: string | null;
  old_unit_cost: number | null;
  new_unit_cost: number | null;
  qty: number | null;
  currency: string | null;
  new_fixed_item_id: number | null;
  fixed_item_id:number | null
  new_fixed_item:[]
}

export interface ItemsCounts {
  add: number;
  delete: number;
  update_supplier: number;
  update_cost: number;
}

export interface PrSnapshotItem {
  id: number;
  supplier_id: number;
  fixed_item_id: number;
  item_name?: string | null;
  qty: number;
  unit_cost: number;
  currency: string;
}

export interface PrSnapshotHeader {
  id: number;
  pr_code: string;
  pr_date: string; // 'YYYY-MM-DD'
  total_price: number;
  pr_path: string | null;
  url?: string | null;
}

export interface PrSnapshot {
  id: number;
  pr_code: string;
  pr_date: string;
  total_price: number;
  pr_path: string | null;
  url?: string | null;
  items: PrSnapshotItem[];
}

export interface PreviewAfter {
  header_after: {
    pr_code: string;
    pr_date: string; // ISO
    total_price: number;
    pr_path: string | null;
  };
  items_after: Array<
    PrSnapshotItem & { pr_id?: number; created_at?: string | null; updated_at?: string | null; __touched?: string[] }
  >;
}

export interface PrEditRequestDetailDto {
  id: number;
  status: string;
  request_date: string;
  requested_by: { id: number; name: string; email: string };
  approved_by_admin_id: number | null;
  header_diffs: PrHeaderDiffs;
  items_diffs: ItemDiff[];
  items_counts: ItemsCounts;
  pr_snapshot: PrSnapshot;
  preview_after: PreviewAfter;
}

export interface ApiDetailResponse {
  data: PrEditRequestDetailDto;
}
