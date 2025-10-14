export interface Category { id: number; name: string; }
export interface SubCategory { id: number; name: string; category_id: number; }
export interface FixedItem { id: number; name: string; sub_category_id: number; }

export type SelectOption = { id: number | string; label: string };