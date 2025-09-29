import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { DEMO_COUNTRIES, TtCountry } from '../org-demo.data';

export type TtUnit    = { id:number; name:string; unit_admins:string[]; standards:string[] };
export type TtEntity  = { id:number; name:string; heads:string[]; units:TtUnit[] };
export type TtCountry = { id:number; name:string; country_dirs:string[]; entities:TtEntity[] };


@Component({
  selector: 'app-structure-matrix',
  templateUrl: './structure-matrix.component.html',
  styleUrls: ['./structure-matrix.component.scss'],
  // standalone: true,
})
export class StructureMatrixComponent {
  @Input() countries: TtCountry[] = [];

  // standard properties (no signals)
  search = '';
  selected: { countryId: number | null; entityName: string | null } = { countryId: null, entityName: null };

  // build unique entity names for header
  get entityNames(): string[] {
    const set = new Set<string>();
    for (const c of this.countries) for (const e of c.entities) set.add(e.name);
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }

  matchesQuery(name: string): boolean {
    const q = this.search.trim().toLowerCase();
    return !q || name.toLowerCase().includes(q);
  }

  unitsCount(countryId: number, entityName: string): number {
    const c = this.countries.find(x => x.id === countryId);
    const e = c?.entities.find(x => x.name === entityName);
    return e?.units?.length ?? 0;
    }

  usersCount(countryId: number, entityName: string): number {
    const c = this.countries.find(x => x.id === countryId);
    const e = c?.entities.find(x => x.name === entityName);
    if (!e?.units) return 0;
    let s = 0;
    for (const u of e.units) s += (u.unit_admins?.length || 0) + (u.standards?.length || 0);
    return s;
  }

  selectCell(countryId: number, entityName: string) {
    this.selected = { countryId, entityName };
  }

  // ✅ use trackBy METHODS (not inline arrow functions in template)
  trackByCountry = (_: number, c: TtCountry) => c.id;
  trackByEntityName = (_: number, name: string) => name;
}
