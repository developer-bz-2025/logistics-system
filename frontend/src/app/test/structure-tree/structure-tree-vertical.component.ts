import { Component, ChangeDetectionStrategy } from '@angular/core';

type TtUnit    = { id:number; name:string; unit_admins:string[]; standards:string[] };
type TtEntity  = { id:number; name:string; heads:string[]; units:TtUnit[] };
type TtCountry = { id:number; name:string; country_dirs:string[]; entities:TtEntity[] };

@Component({
  selector: 'app-structure-tree-vertical',
  templateUrl: './structure-tree-vertical.component.html',
  styleUrls: ['./structure-tree-vertical.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StructureTreeVerticalComponent {

  // ---- Demo Data (swap with API later) ----
  ttCountries: TtCountry[] = [
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
      id: 2, name: 'Jordan', country_dirs: ['Omar Nasser'],
      entities: [
        { id: 1, name: 'BZ', heads: ['Hanin S.'], units: [
          { id: 121, name: 'IT',         unit_admins: ['Sami A.'],     standards: ['Lina D.', 'Omar H.'] },
          { id: 122, name: 'Programs',   unit_admins: ['Reem Y.'],     standards: ['Tala R.', 'Ibrahim Q.', 'Dana J.'] },
        ]},
        { id: 2, name: 'CSEU', heads: ['Firas G.'], units: [
          { id: 221, name: 'Dev',        unit_admins: ['Nadia W.'],    standards: ['Mohannad S.', 'Aya L.'] },
          { id: 222, name: 'Ops',        unit_admins: ['Nour E.'],     standards: ['Khaled A.'] },
          { id: 223, name: 'Design',     unit_admins: ['Yousef R.'],   standards: ['Sahar P.', 'Ruba U.'] },
        ]},
      ]
    },
    {
      id: 3, name: 'Iraq', country_dirs: ['Sara Karim'],
      entities: [
        { id: 2, name: 'CSEU', heads: ['Ola K.'], units: [
          { id: 231, name: 'Dev',        unit_admins: ['Hasan V.'],    standards: ['Maha T.'] },
        ]},
        { id: 4, name: 'Shatila Studio', heads: ['Adel S.'], units: [
          { id: 441, name: 'Media',      unit_admins: ['Reyhan B.'],   standards: ['Rayan C.', 'Hala N.'] },
        ]},
      ]
    },
    {
      id: 4, name: 'Syria', country_dirs: ['Fadi Barakat'],
      entities: [
        { id: 3, name: 'Pioneer', heads: ['Sameer J.'], units: [
          { id: 331, name: 'Field Ops',  unit_admins: ['Kinan T.'],    standards: ['Ola A.', 'Rasha S.'] },
          { id: 332, name: 'Logistics',  unit_admins: ['Joud M.'],     standards: ['Bilal F.'] },
        ]},
      ]
    },
  ];

  // Global roles (header chips)
  ttSuperAdmins = ['Super Admin A'];
  ttCLevels     = ['Exec One', 'Exec Two'];

  // ---- UI state: expand & “reveal names” toggles ----
  ttOpenCountryIds = new Set<number>([1]);                            // countries expanded
  ttOpenEntityKeys = new Set<string>();                               // `${countryId}:${entityId}`
  ttShowCountryDirNames = new Set<number>();                          // countryId
  ttShowEntityHeadNames  = new Set<string>();                         // entity key
  ttShowUnitAdminNames   = new Set<number>();                         // unitId
  ttShowStandardNames    = new Set<number>();                         // unitId

  // ---- Helpers (template-safe) ----
  ttEntityKey(countryId:number, entityId:number) { return `${countryId}:${entityId}`; }
  ttToggleCountry(id:number) { this.ttOpenCountryIds.has(id) ? this.ttOpenCountryIds.delete(id) : this.ttOpenCountryIds.add(id); }
  ttToggleEntity(cId:number, eId:number) {
    const k = this.ttEntityKey(cId, eId);
    this.ttOpenEntityKeys.has(k) ? this.ttOpenEntityKeys.delete(k) : this.ttOpenEntityKeys.add(k);
  }
  ttIsEntityOpen(cId:number, eId:number) { return this.ttOpenEntityKeys.has(this.ttEntityKey(cId, eId)); }

  ttToggleCountryDirs(id:number)  { this.ttShowCountryDirNames.has(id) ? this.ttShowCountryDirNames.delete(id) : this.ttShowCountryDirNames.add(id); }
  ttToggleEntityHeads(cId:number, eId:number) {
    const k = this.ttEntityKey(cId, eId);
    this.ttShowEntityHeadNames.has(k) ? this.ttShowEntityHeadNames.delete(k) : this.ttShowEntityHeadNames.add(k);
  }
  ttToggleUnitAdmins(uId:number)  { this.ttShowUnitAdminNames.has(uId) ? this.ttShowUnitAdminNames.delete(uId) : this.ttShowUnitAdminNames.add(uId); }
  ttToggleStandards(uId:number)   { this.ttShowStandardNames.has(uId) ? this.ttShowStandardNames.delete(uId) : this.ttShowStandardNames.add(uId); }

  ttUnitCount(e:TtEntity):number { return e.units ? e.units.length : 0; }
  ttUsersSum(e:TtEntity):number {
    let s = 0;
    if (e.units) for (let i=0;i<e.units.length;i++) {
      s += (e.units[i].unit_admins?.length || 0) + (e.units[i].standards?.length || 0);
    }
    return s;
  }

  // Role chip styles (🧑‍💼 family)
  ttChip(role:'country_dir'|'head_of_entity'|'unit_admin'|'standard') {
    switch(role) {
      case 'country_dir':    return { icon:'🧑‍💼🌍',  bg:'bg-indigo-50',  fg:'text-indigo-700',  br:'border-indigo-200' };
      case 'head_of_entity': return { icon:'🧑‍💼🏢',  bg:'bg-sky-50',     fg:'text-sky-700',     br:'border-sky-200' };
      case 'unit_admin':     return { icon:'🧑‍💼🛠️', bg:'bg-emerald-50', fg:'text-emerald-700', br:'border-emerald-200' };
      default:               return { icon:'🧑‍💼',    bg:'bg-slate-100',  fg:'text-slate-700',   br:'border-slate-200' };
    }
  }
}
