export interface Person { id: number; name: string; }

export interface OrgStructureResponse {
  organization: { name: string };
  super_admin: Person | null;
  c_levels: Person[];

  entities: Array<{ id: number; name: string; head: Person | null }>;
  countries: Array<{ id: number; name: string }>;

  country_entity_directors: Array<{
    entity_id: number;
    country_id: number;
    director: Person | null;
  }>;

  units: Array<{
    id: number;
    name: string;
    entity_id: number;
    country_id: number;
    unit_admins: Person[];
    standards: Person[];
  }>;
}
