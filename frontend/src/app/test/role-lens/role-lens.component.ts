import { Component, ChangeDetectionStrategy, Input} from '@angular/core';
import { DEMO_COUNTRIES, TtCountry, TtEntity, TtUnit } from '../org-demo.data';


type RoleKey = 'super_admin'|'c_level'|'country_dir'|'head_of_entity'|'unit_admin'|'standard';

@Component({
  selector: 'app-role-lens',
  templateUrl: './role-lens.component.html',
  styleUrls: ['./role-lens.component.scss']
})
export class RoleLensComponent {
  @Input() countries: TtCountry[] = [];

  role: RoleKey = 'standard';
  focusCountryId: number | null = null;
  focusEntityName: string | null = null;

  get entityNamesAll(): string[] {
    const set = new Set<string>();
    for (const c of this.countries) for (const e of c.entities) set.add(e.name);
    return Array.from(set).sort();
  }

  countriesForRole(): TtCountry[] {
    // keep simple for demo—filtering can be tightened later
    return this.countries;
  }

  entitiesForCountry(c: TtCountry): TtEntity[] {
    if (this.focusEntityName) return c.entities.filter(e => e.name === this.focusEntityName);
    return c.entities;
  }

  trackByCountry = (_: number, c: TtCountry) => c.id;
  trackByEntity  = (_: number, e: TtEntity) => e.id;
  trackByUnit    = (_: number, u: TtUnit) => u.id;

}
