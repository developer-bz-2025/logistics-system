export interface DonorDocument {
  id: number;
  donor_id: number;
  original_name: string;
  file_path: string;
  file_url?: string;
  mime_type?: string;
  uploaded_by?: number;
  uploader?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Donor {
  id: number;
  account_no?: string;
  department_name?: 'education' | 'protection' | 'FSL' | 'peace_building' | 'advocacy_research' | 'support_community' | 'basic_assistance_emergency' | 'capacity_building_admin_support';
  finance_officer_id?: number;
  finance_officer?: {
    id: number;
    name: string;
    email?: string;
  };
  donor: string;
  end_date?: string;
  notes?: string;
  locations?: Array<{
    id: number;
    name: string;
  }>;
  documents?: DonorDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface DonorListItem {
  id: number;
  donor: string;
  account_no?: string;
  department_name?: string;
}
