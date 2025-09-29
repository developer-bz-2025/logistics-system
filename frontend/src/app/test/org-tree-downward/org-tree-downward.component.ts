import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrgStructureService } from 'src/app/core/services/org-structure.service';


// ------- Types (match your backend) -------
export interface Person { id:number; name:string; }
export interface OrgStructureResponse {
  organization: { name: string };
  super_admin: Person | null;
  c_levels: any;
  entities: Array<{ id:number; name:string; head: Person | null }>;
  countries: Array<{ id:number; name:string }>;
  country_entity_directors: Array<{ entity_id:number; country_id:number; director: Person | null }>;
  units: Array<{
    id:number; name:string; entity_id:number; country_id:number;
    unit_admins: any; standards: any;
  }>;
}

// ------- Normalize helpers -------
function asPeopleArray(v:any): Person[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
}
function normalizeOrg(res: OrgStructureResponse): OrgStructureResponse {
  return {
    ...res,
    c_levels: asPeopleArray(res.c_levels),
    units: (res.units || []).map(u => ({
      ...u,
      unit_admins: asPeopleArray(u.unit_admins),
      standards:   asPeopleArray(u.standards),
    })),
    country_entity_directors: (res.country_entity_directors || []).map(r => ({
      ...r, director: r.director ?? null,
    })),
  };
}

@Component({
  selector: 'app-org-tree-downward',
  templateUrl: './org-tree-downward.component.html',
  styleUrls: ['./org-tree-downward.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgTreeDownwardComponent implements OnInit {
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private orgService:OrgStructureService) {}

  @Input() profileUrlBase = '/workspace/profile'; // change to your actual route base

  profileUrl(id: number): string {
    return `${this.profileUrlBase}/${id}`;
  }
  
  // Single-value helpers (no arrays in template)
  headForEntity(entityId: number): Person | null {
    const a = this.entityHead(entityId);
    return a && a.length ? a[0] : null;
  }
  directorFor(entityId: number, countryId: number): Person | null {
    const a = this.countryDirector(entityId, countryId);
    return a && a.length ? a[0] : null;
  }
  
  org: OrgStructureResponse | null = null;
  loading = true;
  error: string | null = null;

  // Selection drives each next row
  showEntities = false;
  selectedEntityId: number | null = null;
  selectedCountryId: number | null = null;

  ngOnInit() {
    this.orgService.get().subscribe({
      next: (res) => { this.org = normalizeOrg(res); this.loading = false; this.cdr.markForCheck(); },
      error: ()    => { this.error = 'Failed to load organization data'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  // -------- Derived data (no arrows in template) --------
  get orgName(): string { return this.org?.organization?.name || 'Organization'; }
  superAdmin(): Person[] { return this.org?.super_admin ? [this.org.super_admin] : []; }
  cLevels(): Person[] { return this.org?.c_levels || []; }

  allEntities(): { id:number; name:string; head:Person|null; countriesCount:number }[] {
    if (!this.org) return [];
    const map = new Map<number, Set<number>>();
    for (const u of this.org.units) {
      if (!map.has(u.entity_id)) map.set(u.entity_id, new Set());
      map.get(u.entity_id)!.add(u.country_id);
    }
    return this.org.entities
      .map(e => ({ id:e.id, name:e.name, head:e.head ?? null, countriesCount: map.get(e.id)?.size || 0 }))
      .sort((a,b)=>a.name.localeCompare(b.name));
  }

  entityName(id:number|null): string {
    if (!this.org || id==null) return '';
    return this.org.entities.find(e=>e.id===id)?.name || '';
  }

  countriesForEntity(entityId:number): Array<{id:number; name:string}> {
    if (!this.org) return [];
    const present = new Set(this.org.units.filter(u=>u.entity_id===entityId).map(u=>u.country_id));
    return this.org.countries.filter(c=>present.has(c.id)).sort((a,b)=>a.name.localeCompare(b.name));
  }

  countryNameForEntity(entityId:number|null, countryId:number|null): string {
    if (!this.org || entityId==null || countryId==null) return '';
    return this.countriesForEntity(entityId).find(c=>c.id===countryId)?.name || '';
  }

  unitsFor(entityId:number, countryId:number) {
    if (!this.org) return [];
    return this.org.units
      .filter(u=>u.entity_id===entityId && u.country_id===countryId)
      .sort((a,b)=>a.name.localeCompare(b.name));
  }

  unitsCountFor(entityId:number|null, countryId:number|null): number {
    if (entityId==null || countryId==null) return 0;
    return this.unitsFor(entityId, countryId).length;
  }

  entityHead(entityId:number): Person[] {
    if (!this.org) return [];
    const e = this.org.entities.find(x=>x.id===entityId);
    return e?.head ? [e.head] : [];
  }

  countryDirector(entityId:number|null, countryId:number|null): Person[] {
    if (!this.org || entityId==null || countryId==null) return [];
    const r = this.org.country_entity_directors.find(x=>x.entity_id===entityId && x.country_id===countryId);
    return r?.director ? [r.director] : [];
  }

  totalUsers(u:{unit_admins:Person[]; standards:Person[]}): number {
    return (u.unit_admins?.length || 0) + (u.standards?.length || 0);
  }

  // -------- Interactions --------
  clickRoot(){ this.showEntities = !this.showEntities; if (!this.showEntities) { this.selectedEntityId=null; this.selectedCountryId=null; } }
  clickEntity(id:number){ this.selectedEntityId = (this.selectedEntityId===id) ? null : id; if (this.selectedEntityId===null) this.selectedCountryId=null; }
  clickCountry(id:number){ this.selectedCountryId = (this.selectedCountryId===id) ? null : id; }

  // trackBy
  trackByEntity = (_:number, e:{id:number}) => e.id;
  trackByCountry = (_:number, c:{id:number}) => c.id;
  trackByUnit    = (_:number, u:{id:number}) => u.id;
}
