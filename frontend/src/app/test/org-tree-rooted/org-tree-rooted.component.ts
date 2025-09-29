import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrgStructureService } from 'src/app/core/services/org-structure.service';

// ------- Types (match your backend) -------
export interface Person { id:number; name:string; }
export interface OrgStructureResponse {
  organization: { name: string };
  super_admin: Person | null;
  c_levels: any; // might be array
  entities: Array<{ id:number; name:string; head: Person | null }>;
  countries: Array<{ id:number; name:string }>;
  country_entity_directors: Array<{ entity_id:number; country_id:number; director: Person | null }>;
  units: Array<{
    id:number; name:string; entity_id:number; country_id:number;
    unit_admins: any; // might be array
    standards: any;   // might be array OR object
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
      ...r,
      director: r.director ?? null,
    })),
  };
}

@Component({
  selector: 'app-org-tree-rooted',
  templateUrl: './org-tree-rooted.component.html',
  styleUrls: ['./org-tree-rooted.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgTreeRootedComponent implements OnInit {
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private orgService:OrgStructureService) {}

  // backend data
  org: OrgStructureResponse | null = null;
  loading = true;
  error: string | null = null;

  // tree open state
  rootOpen = true;
  openEntityIds = new Set<number>();
  openCountryKeys = new Set<string>(); // `${entityId}:${countryId}`

  // selection (optional – used for info panel highlighting)
  selectedEntityId: number | null = null;
  selectedCountryId: number | null = null;

  ngOnInit() {
    this.orgService.get().subscribe({
      next: (res) => { this.org = normalizeOrg(res); this.loading = false; this.cdr.markForCheck(); },
      error: ()    => { this.error = 'Failed to load organization data'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  // ---------- Derived ----------
  get orgName(): string { return this.org?.organization?.name || 'Organization'; }

  allEntities(): { id:number; name:string; head:Person|null; countriesCount:number }[] {
    if (!this.org) return [];
    const { entities, units } = this.org;
    const countMap = new Map<number, Set<number>>();
    for (const u of units) {
      if (!countMap.has(u.entity_id)) countMap.set(u.entity_id, new Set());
      countMap.get(u.entity_id)!.add(u.country_id);
    }
    return entities
      .map(e => ({ id: e.id, name: e.name, head: e.head ?? null, countriesCount: countMap.get(e.id)?.size || 0 }))
      .sort((a,b)=> a.name.localeCompare(b.name));
  }

  countriesForEntity(entityId:number) {
    if (!this.org) return [];
    const present = new Set(this.org.units.filter(u=>u.entity_id===entityId).map(u=>u.country_id));
    return this.org.countries.filter(c=>present.has(c.id)).sort((a,b)=>a.name.localeCompare(b.name));
  }

  unitsFor(entityId:number, countryId:number) {
    if (!this.org) return [];
    return this.org.units
      .filter(u=>u.entity_id===entityId && u.country_id===countryId)
      .sort((a,b)=>a.name.localeCompare(b.name));
  }

  superAdmin(): Person[] { return this.org?.super_admin ? [this.org.super_admin] : []; }
  cLevels(): Person[] { return this.org?.c_levels || []; }
  entityHead(entityId:number): Person[] {
    const e = this.org?.entities.find(x=>x.id===entityId);
    return e?.head ? [e.head] : [];
  }
  countryDirector(entityId:number, countryId:number): Person[] {
    const r = this.org?.country_entity_directors.find(x=>x.entity_id===entityId && x.country_id===countryId);
    return r?.director ? [r.director] : [];
  }

  entityName(id:number|null): string {
    const hit = this.org?.entities.find(e=>e.id===id!);
    return hit?.name || '';
  }
  countryName(entityId:number|null, countryId:number|null): string {
    if (!entityId || !countryId) return '';
    const list = this.countriesForEntity(entityId);
    return list.find(c=>c.id===countryId)?.name || '';
  }
  totalUsers(u:{unit_admins:Person[]; standards:Person[]}): number {
    return (u.unit_admins?.length || 0) + (u.standards?.length || 0);
  }

  // ---------- UI toggles ----------
  key(e:number, c:number){ return `${e}:${c}`; }
  isEntityOpen(id:number){ return this.openEntityIds.has(id); }
  toggleEntity(id:number){
    this.openEntityIds.has(id) ? this.openEntityIds.delete(id) : this.openEntityIds.add(id);
    this.selectedEntityId = this.isEntityOpen(id) ? id : null;
    if (!this.selectedEntityId) this.selectedCountryId = null;
  }
  isCountryOpen(eid:number, cid:number){ return this.openCountryKeys.has(this.key(eid,cid)); }
  toggleCountry(eid:number, cid:number){
    const k = this.key(eid,cid);
    this.openCountryKeys.has(k) ? this.openCountryKeys.delete(k) : this.openCountryKeys.add(k);
    this.selectedEntityId = eid;
    this.selectedCountryId = this.isCountryOpen(eid,cid) ? cid : null;
  }
  toggleRoot(){
    this.rootOpen = !this.rootOpen;
    if (!this.rootOpen){ this.openEntityIds.clear(); this.openCountryKeys.clear(); this.selectedEntityId = null; this.selectedCountryId = null; }
  }

  // ---------- trackBy ----------
  trackByEntity = (_:number, e:{id:number}) => e.id;
  trackByCountry = (_:number, c:{id:number}) => c.id;
  trackByUnit    = (_:number, u:{id:number}) => u.id;
}
