export interface ItemEditRequester {
  id: number;
  name: string;
  email: string;
}

export interface ItemEditRequestRow {
  id: number;
  item_id: number;
  item_description?: string | null;
  item_sn?: string | null;
  status: string;
  submitted_at: string;
  requested_by: ItemEditRequester | null;
  changed_fields_count: number;
  reviewed_at?: string | null;
}

export interface ItemFieldDiff {
  field: string;
  label: string;
  old: any;
  new: any;
  old_label?: string | null;
  new_label?: string | null;
}

export interface ItemAttributeDiff {
  att_id: number;
  att_option_id: number;
  name: string;
  old_value?: string | null;
  new_value?: string | null;
}

export interface ItemEditRequestDetail {
  id: number;
  item_id: number;
  item: { id: number; description?: string | null; sn?: string | null } | null;
  status: string;
  submitted_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  requested_by: ItemEditRequester | null;
  reviewed_by?: ItemEditRequester | null;
  field_diffs: ItemFieldDiff[];
  attribute_diffs: ItemAttributeDiff[];
}

export interface PagedItemEditRequests {
  data: ItemEditRequestRow[];
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
  total?: number;
  page?: number;
  pageSize?: number;
  last_page?: number;
}
