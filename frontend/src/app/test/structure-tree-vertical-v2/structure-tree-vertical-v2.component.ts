import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

type TtUnit    = { id:number; name:string; unit_admins:string[]; standards:string[] };
type TtEntity  = { id:number; name:string; heads:string[]; units:TtUnit[] };
type TtCountry = { id:number; name:string; country_dirs:string[]; entities:TtEntity[] };

@Component({
  selector: 'app-structure-tree-vertical-v2',
  templateUrl: './structure-tree-vertical-v2.component.html',
  styleUrls: ['./structure-tree-vertical-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StructureTreeVerticalV2Component {

  // You can pass real API data through [countries]
  @Input() countries: TtCountry[] = [];

  // Fallback demo (used only if @Input not provided)
  private demo: TtCountry[] = [
    {
      id: 1, name: 'Lebanon', country_dirs: ['Layla Haddad'],
      entities: [
        { id: 1, name: 'BZ', heads: ['Nour Saad'], units: [
          { id: 101, name: 'IT',         unit_admins: ['Alaa Zaibak'], standards: ['Maya T.', 'Rami K.', 'Zeinab S.'] },
          { id: 102, name: 'Protection', unit_admins: ['Hadi M.'],     standards: ['Amal E.', 'Jad B.'] },
          { id: 103, name: 'MEAL',       unit_admins: ['Yara A.'],     standards: ['Ola F.'] },
        ]},
        { id: 3, name: 'Pioneer', heads: ['Walid R.'], units: [
          { id: 131, name: 'Field Ops',  unit_admins: ['Mira K.'],     standards: ['Ali Z.', 'Hussein M.', 'Sara N.'] },
        ]},
      ]
    },
    {
      id: 2, name: 'Syria', country_dirs: ['Fadi Barakat'],
      entities: [
        { id: 3, name: 'Pioneer', heads: ['Sameer J.'], units: [
          { id: 331, name: 'Field Ops',  unit_admins: ['Kinan T.'],    standards: ['Ola A.', 'Rasha S.'] },
          { id: 332, name: 'Logistics',  unit_admins: ['Joud M.'],     standards: ['Bilal F.'] },
        ]},
        { id: 2, name: 'CSEU', heads: ['Firas G.'], units: [
          { id: 221, name: 'Dev',        unit_admins: ['Nadia W.'],    standards: ['Mohannad S.', 'Aya L.'] },
          { id: 222, name: 'Ops',        unit_admins: ['Nour E.'],     standards: ['Khaled A.'] },
          { id: 223, name: 'Design',     unit_admins: ['Yousef R.'],   standards: ['Sahar P.', 'Ruba U.'] },
        ]},
      ]
    }
  ];

  // UI state
  search = '';
  openCountryIds = new Set<number>();             // expanded countries
  openEntityKeys = new Set<string>();             // `${countryId}:${entityId}`
  showCountryDirNames = new Set<number>();        // countryId
  showEntityHeadNames  = new Set<string>();       // entity key
  showUnitAdmins       = new Set<number>();       // unitId
  showStandards        = new Set<number>();       // unitId

  // Helpers
  get data(): TtCountry[] {
    return this.countries?.length ? this.countries : this.demo;
  }
  key(cId:number, eId:number) { return `${cId}:${eId}`; }

  // Counts
  unitCount(e:TtEntity): number { return e.units?.length ?? 0; }
  usersSum(e:TtEntity): number {
    let s = 0;
    for (const u of (e.units || [])) s += (u.unit_admins?.length||0) + (u.standards?.length||0);
    return s;
  }

  // Filters
  matchesQueryCountry(c:TtCountry): boolean {
    const q = this.search.trim().toLowerCase(); if (!q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    // match entity or unit names too
    for (const e of c.entities) {
      if (e.name.toLowerCase().includes(q)) return true;
      for (const u of e.units) if (u.name.toLowerCase().includes(q)) return true;
    }
    return false;
  }
  matchesQueryEntity(e:TtEntity, countryName:string): boolean {
    const q = this.search.trim().toLowerCase(); if (!q) return true;
    return e.name.toLowerCase().includes(q) || countryName.toLowerCase().includes(q)
      || e.units.some(u=>u.name.toLowerCase().includes(q));
  }

  // Toggles
  toggleSet(set:Set<any>, key:any){ set.has(key) ? set.delete(key) : set.add(key); }
  toggleCountry(id:number){ this.toggleSet(this.openCountryIds, id); }
  toggleEntity(cId:number, eId:number){ this.toggleSet(this.openEntityKeys, this.key(cId,eId)); }
  toggleCountryDirs(id:number){ this.toggleSet(this.showCountryDirNames, id); }
  toggleEntityHeads(cId:number, eId:number){ this.toggleSet(this.showEntityHeadNames, this.key(cId,eId)); }
  toggleAdmins(uId:number){ this.toggleSet(this.showUnitAdmins, uId); }
  toggleStand(uId:number){ this.toggleSet(this.showStandards, uId); }

  // Expand/Collapse all
  expandAllCountries(){ this.openCountryIds = new Set(this.data.map(c=>c.id)); }
  collapseAllCountries(){ this.openCountryIds.clear(); }
  expandAllEntities(){
    const all = new Set<string>();
    for (const c of this.data) for (const e of c.entities) all.add(this.key(c.id,e.id));
    this.openEntityKeys = all;
  }
  collapseAllEntities(){ this.openEntityKeys.clear(); }

  // trackBy
  trackByCountry = (_:number, c:TtCountry)=>c.id;
  trackByEntity  = (_:number, e:TtEntity)=>e.id;
  trackByUnit    = (_:number, u:TtUnit)=>u.id;
}
