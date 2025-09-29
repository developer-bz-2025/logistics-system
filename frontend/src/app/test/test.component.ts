import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

type Country = { id: number; name: string; color?: string };
type Entity = { id: number; name: string; color?: string };
type Link = { country_id: number; entity_id: number; units: number };

type UnitNode    = { id:number; name:string; users:number };              // users = standard count (demo)
type EntityNode  = { id:number; name:string; units:UnitNode[]; alsoIn?: string[] };
type CountryNode = { id:number; name:string; entities:EntityNode[] };

type HxUnit    = { id:number; name:string; unit_admins:string[]; standards:string[] };
type HxEntity  = { id:number; name:string; heads:string[]; units:HxUnit[] };
type HxCountry = { id:number; name:string; country_dirs:string[]; entities:HxEntity[] };


// block 6
type VxUnit    = { id:number; name:string; unit_admins:string[]; standards:string[] };
type VxEntity  = { id:number; name:string; heads:string[]; units:VxUnit[] };
type VxCountry = { id:number; name:string; country_dirs:string[]; entities:VxEntity[] };



@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestComponent implements OnInit {

  // ===== WIDGET 1: Bubble Matrix =====
  bubbleCountries = [
    { id: 1, name: 'Lebanon' },
    { id: 2, name: 'Jordan' },
    { id: 3, name: 'Iraq' },
    { id: 4, name: 'Syria' },
  ];
  bubbleEntities = [
    { id: 1, name: 'BZ' },
    { id: 2, name: 'CSEU' },
    { id: 3, name: 'Pioneer' },
    { id: 4, name: 'Shatila Studio' },
  ];
  // relationship values = number of units (use resources if you want)
  bubbleLinks = [
    { country_id: 1, entity_id: 1, units: 6 },
    { country_id: 1, entity_id: 3, units: 2 },
    { country_id: 2, entity_id: 1, units: 4 },
    { country_id: 2, entity_id: 2, units: 7 },
    { country_id: 3, entity_id: 2, units: 3 },
    { country_id: 3, entity_id: 4, units: 5 },
    { country_id: 4, entity_id: 1, units: 1 },
    { country_id: 4, entity_id: 3, units: 4 },
  ];

  bubbleGrid: number[][] = [];
  bubbleMax = 1;
  bubbleHoverRow = -1;
  bubbleHoverCol = -1;

  initBubbleGrid(): void {
    this.bubbleGrid = Array.from({ length: this.bubbleCountries.length }, () =>
      Array.from({ length: this.bubbleEntities.length }, () => 0)
    );
    for (const l of this.bubbleLinks) {
      const r = this.bubbleCountries.findIndex(c => c.id === l.country_id);
      const c = this.bubbleEntities.findIndex(e => e.id === l.entity_id);
      if (r >= 0 && c >= 0) {
        this.bubbleGrid[r][c] += l.units;
        if (this.bubbleGrid[r][c] > this.bubbleMax) this.bubbleMax = this.bubbleGrid[r][c];
      }
    }
    if (this.bubbleMax < 1) this.bubbleMax = 1;
  }

  bubbleRadius(v: number): number {
    // radius 6..18 based on max
    const minR = 6, maxR = 18;
    const t = Math.max(0, Math.min(1, v / (this.bubbleMax || 1)));
    return minR + t * (maxR - minR);
  }
  bubbleCellTitle(ri: number, ci: number): string {
    const c = this.bubbleCountries[ri]?.name || '';
    const e = this.bubbleEntities[ci]?.name || '';
    const v = this.bubbleGrid[ri]?.[ci] ?? 0;
    return `${c} × ${e}: ${v} units`;
  }



  /* ============================================================
   * A) CHORD / RIBBONS (many-to-many)
   * ============================================================ */
  countriesChordDemo: Country[] = [
    { id: 1, name: 'Lebanon', color: '#6366F1' },   // indigo-500
    { id: 2, name: 'Jordan', color: '#22C55E' },   // emerald-500
    { id: 3, name: 'Iraq', color: '#F59E0B' },   // amber-500
    { id: 4, name: 'Syria', color: '#EC4899' },   // pink-500
  ];

  entitiesChordDemo: Entity[] = [
    { id: 1, name: 'BZ', color: '#3B82F6' }, // blue-500
    { id: 2, name: 'CSEU', color: '#A855F7' }, // violet-500
    { id: 3, name: 'Pioneer', color: '#10B981' }, // green-500
    { id: 4, name: 'Shatila Studio', color: '#F43F5E' }, // rose-500
  ];

  linksChordDemo: Link[] = [
    { country_id: 1, entity_id: 1, units: 6 },
    { country_id: 1, entity_id: 3, units: 2 },
    { country_id: 2, entity_id: 1, units: 4 },
    { country_id: 2, entity_id: 2, units: 7 },
    { country_id: 3, entity_id: 2, units: 3 },
    { country_id: 3, entity_id: 4, units: 5 },
    { country_id: 4, entity_id: 1, units: 1 },
    { country_id: 4, entity_id: 3, units: 4 },
  ];

  // layout
  chordW = 900;
  chordH = 380;
  chordR = 150;               // radius for side arcs
  chordCxLeft = 220;         // left arc center
  chordCxRight = 680;         // right arc center
  chordCy = 190;
  chordStrokeMin = 3;
  chordStrokeMax = 14;
  chordCurvePull = 120;

  // hover state
  chordHoverCountryId: number | null = null;
  chordHoverEntityId: number | null = null;

  chordAngle(total: number, index: number): number {
    // distribute across ~180° arcs
    const start = -90 - 70; // degrees
    const end = -90 + 70;
    const t = (total <= 1) ? 0 : index / (total - 1);
    const deg = start + (end - start) * t;
    return (Math.PI / 180) * deg;
  }
  chordPosLeft(idx: number) {
    const a = this.chordAngle(this.countriesChordDemo.length, idx);
    return {
      x: this.chordCxLeft + this.chordR * Math.cos(a),
      y: this.chordCy + this.chordR * Math.sin(a),
    };
  }
  chordPosRight(idx: number) {
    const a = this.chordAngle(this.entitiesChordDemo.length, idx);
    return {
      x: this.chordCxRight + this.chordR * Math.cos(Math.PI - a),
      y: this.chordCy + this.chordR * Math.sin(Math.PI - a),
    };
  }
  chordCountryIndexById(id: number): number {
    for (let i = 0; i < this.countriesChordDemo.length; i++) if (this.countriesChordDemo[i].id === id) return i;
    return -1;
  }
  chordEntityIndexById(id: number): number {
    for (let i = 0; i < this.entitiesChordDemo.length; i++) if (this.entitiesChordDemo[i].id === id) return i;
    return -1;
  }
  chordLinkPath(x1: number, y1: number, x2: number, y2: number): string {
    const cx1 = x1 + this.chordCurvePull;
    const cx2 = x2 - this.chordCurvePull;
    return `M ${x1},${y1} C ${cx1},${y1} ${cx2},${y2} ${x2},${y2}`;
  }
  chordStrokeFor(units: number): number {
    const vals = this.linksChordDemo.map(l => l.units);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max === min) return this.chordStrokeMax;
    const t = (units - min) / (max - min);
    return this.chordStrokeMin + t * (this.chordStrokeMax - this.chordStrokeMin);
  }
  chordColorForCountry(id: number): string {
    return this.countriesChordDemo.find(c => c.id === id)?.color || '#64748B';
  }
  chordIsDimmed(link: Link): boolean {
    if (this.chordHoverCountryId != null) return link.country_id !== this.chordHoverCountryId;
    if (this.chordHoverEntityId != null) return link.entity_id !== this.chordHoverEntityId;
    return false;
  }
  setChordHoverCountry(id: number | null) { this.chordHoverCountryId = id; this.chordHoverEntityId = null; }
  setChordHoverEntity(id: number | null) { this.chordHoverEntityId = id; this.chordHoverCountryId = null; }

  /* ============================================================
   * B) PILL FILTERS (super simple)
   * ============================================================ */
  countriesPillsDemo: Country[] = [
    { id: 1, name: 'Lebanon' },
    { id: 2, name: 'Jordan' },
    { id: 3, name: 'Iraq' },
    { id: 4, name: 'Syria' },
  ];
  entitiesPillsDemo: Entity[] = [
    { id: 1, name: 'BZ' },
    { id: 2, name: 'CSEU' },
    { id: 3, name: 'Pioneer' },
    { id: 4, name: 'Shatila Studio' },
  ];
  linksPillsDemo: Link[] = JSON.parse(JSON.stringify(this.linksChordDemo));

  selectedCountryIdPillsDemo: number | null = null;
  selectedEntityIdPillsDemo: number | null = null;

  toggleCountryPillsDemo(id: number) {
    this.selectedCountryIdPillsDemo = (this.selectedCountryIdPillsDemo === id ? null : id);
  }
  toggleEntityPillsDemo(id: number) {
    this.selectedEntityIdPillsDemo = (this.selectedEntityIdPillsDemo === id ? null : id);
  }
  pillsCountFor(countryId: number | null, entityId: number | null): number {
    let total = 0;
    for (const l of this.linksPillsDemo) {
      if (countryId != null && l.country_id !== countryId) continue;
      if (entityId != null && l.entity_id !== entityId) continue;
      total += l.units;
    }
    return total;
  }

  /* ============================================================
   * C) ROLE SCOPE SIMULATOR (what do I see?)
   * ============================================================ */
  rolesSimDemo = [
    { id: 'super_admin', name: 'Super Admin' },
    { id: 'c_level', name: 'C-level' },
    { id: 'country_dir', name: 'Country Director' },
    { id: 'head_of_entity', name: 'Head of Entity' },
    { id: 'unit_admin', name: 'Unit Admin' },
    { id: 'standard', name: 'Standard' },
  ];

  countriesSimDemo = JSON.parse(JSON.stringify(this.countriesPillsDemo)) as Country[];
  entitiesSimDemo = JSON.parse(JSON.stringify(this.entitiesPillsDemo)) as Entity[];

  // tiny demo “resource” bag (country, entity, unit, visibility)
  resourcesSimDemo = [
    // Lebanon
    { country_id: 1, entity_id: 1, unit_id: 11, visibility: 'Internal' },
    { country_id: 1, entity_id: 1, unit_id: 12, visibility: 'Public' },
    { country_id: 1, entity_id: 3, unit_id: 13, visibility: 'Global' },
    { country_id: 1, entity_id: 3, unit_id: 14, visibility: 'Internal' },
    // Jordan
    { country_id: 2, entity_id: 1, unit_id: 21, visibility: 'Public' },
    { country_id: 2, entity_id: 2, unit_id: 22, visibility: 'Internal' },
    { country_id: 2, entity_id: 2, unit_id: 23, visibility: 'Global' },
    // Iraq
    { country_id: 3, entity_id: 2, unit_id: 31, visibility: 'Public' },
    { country_id: 3, entity_id: 4, unit_id: 32, visibility: 'Internal' },
    { country_id: 3, entity_id: 4, unit_id: 33, visibility: 'Global' },
    // Syria
    { country_id: 4, entity_id: 1, unit_id: 41, visibility: 'Public' },
    { country_id: 4, entity_id: 3, unit_id: 42, visibility: 'Global' },
    { country_id: 4, entity_id: 3, unit_id: 43, visibility: 'Internal' },
  ];

  selectedRoleSimDemo = 'standard';
  selectedCountryIdSimDemo: number | null = null;
  selectedEntityIdSimDemo: number | null = null;
  selectedUnitIdSimDemo: number | null = null;

  onRoleChangeSimDemo(v: string) { this.selectedRoleSimDemo = v; }
  onCountryChangeSimDemo(v: any) { this.selectedCountryIdSimDemo = this.toNum(v) ?? null; }
  onEntityChangeSimDemo(v: any) { this.selectedEntityIdSimDemo = this.toNum(v) ?? null; }
  onUnitChangeSimDemo(v: any) { this.selectedUnitIdSimDemo = this.toNum(v) ?? null; }

  // simplified rule check (per your earlier spec; Confidential omitted)
  private canSeeSimDemo(role: string, r: any,
    myCountry?: number | null, myEntity?: number | null, myUnit?: number | null): boolean {
    switch (role) {
      case 'super_admin':
      case 'c_level':
        return r.visibility !== 'Confidential';
      case 'country_dir':
        // own country & own entity: Internal/Public/Global; other entities: Global only
        if (myCountry && r.country_id === myCountry) {
          if (myEntity && r.entity_id === myEntity) return r.visibility !== 'Confidential';
          return r.visibility === 'Global' || r.visibility === 'Public' || r.visibility === 'Internal';
        }
        return r.visibility === 'Global';
      case 'head_of_entity':
        // own entity: all but Confidential ; other entities: Global only
        if (myEntity && r.entity_id === myEntity) return r.visibility !== 'Confidential';
        return r.visibility === 'Global';
      case 'unit_admin':
      case 'standard':
        // own unit: Internal; own entity: Public; across entities: Global
        if (myUnit && r.unit_id === myUnit) return r.visibility === 'Internal' || r.visibility === 'Public' || r.visibility === 'Global';
        if (myEntity && r.entity_id === myEntity) return r.visibility === 'Public' || r.visibility === 'Global';
        return r.visibility === 'Global';
      default:
        return r.visibility === 'Global';
    }
  }

  get visCountsSimDemo(): { Global: number; Public: number; Internal: number } {
    const counts = { Global: 0, Public: 0, Internal: 0 };
    for (const r of this.resourcesSimDemo) {
      if (this.canSeeSimDemo(
        this.selectedRoleSimDemo,
        r,
        this.selectedCountryIdSimDemo,
        this.selectedEntityIdSimDemo,
        this.selectedUnitIdSimDemo
      )) {
        if (r.visibility === 'Global') counts.Global++;
        else if (r.visibility === 'Public') counts.Public++;
        else if (r.visibility === 'Internal') counts.Internal++;
      }
    }
    return counts;
  }

  private toNum(v: any): number | undefined {
    const n = +v;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  ngOnInit(): void { }

  // ===== WIDGET 2: Subway Map =====
  subwayCountries = [
    { id: 1, name: 'Lebanon', color: '#6366F1' }, // indigo
    { id: 2, name: 'Jordan', color: '#22C55E' }, // emerald
    { id: 3, name: 'Iraq', color: '#F59E0B' }, // amber
    { id: 4, name: 'Syria', color: '#EC4899' }, // pink
  ];
  subwayEntities = [
    { id: 1, name: 'BZ' },
    { id: 2, name: 'CSEU' },
    { id: 3, name: 'Pioneer' },
    { id: 4, name: 'Shatila Studio' },
  ];
  subwayLinks = [
    { country_id: 1, entity_id: 1, units: 6 },
    { country_id: 1, entity_id: 3, units: 2 },
    { country_id: 2, entity_id: 1, units: 4 },
    { country_id: 2, entity_id: 2, units: 7 },
    { country_id: 3, entity_id: 2, units: 3 },
    { country_id: 3, entity_id: 4, units: 5 },
    { country_id: 4, entity_id: 1, units: 1 },
    { country_id: 4, entity_id: 3, units: 4 },
  ];

  subwayW = 920;
  subwayH = 260;
  subwayPadX = 80;
  subwayPadY = 36;
  subwayLineGap = 40;
  subwayStationGap = 180;

  subwayHoverCountryId: number | null = null;

  subwayYForLine(i: number): number { return this.subwayPadY + i * this.subwayLineGap; }
  subwayXForStation(j: number): number { return this.subwayPadX + j * this.subwayStationGap; }

  subwayStationsForCountry(countryId: number): number[] {
    const indices: number[] = [];
    for (let j = 0; j < this.subwayEntities.length; j++) {
      const entId = this.subwayEntities[j].id;
      const has = this.subwayLinks.some(l => l.country_id === countryId && l.entity_id === entId);
      if (has) indices.push(j);
    }
    return indices;
  }
  subwayUnitsAt(countryId: number, entityId: number): number {
    const l = this.subwayLinks.find(x => x.country_id === countryId && x.entity_id === entityId);
    return l ? l.units : 0;
  }
  subwayDotR(units: number): number {
    const min = 3, max = 10;
    // compute a rough max from links
    const maxUnits = Math.max(...this.subwayLinks.map(l => l.units), 1);
    return min + (units / maxUnits) * (max - min);
  }

  // ===== WIDGET 3: Drilldown Explorer =====
  drillCountries = [
    { id: 1, name: 'Lebanon' },
    { id: 2, name: 'Jordan' },
    { id: 3, name: 'Iraq' },
    { id: 4, name: 'Syria' },
  ];
  drillEntities = [
    { id: 1, name: 'BZ' },
    { id: 2, name: 'CSEU' },
    { id: 3, name: 'Pioneer' },
    { id: 4, name: 'Shatila Studio' },
  ];
  drillLinks = [
    { country_id: 1, entity_id: 1, units: 6 },
    { country_id: 1, entity_id: 3, units: 2 },
    { country_id: 2, entity_id: 1, units: 4 },
    { country_id: 2, entity_id: 2, units: 7 },
    { country_id: 3, entity_id: 2, units: 3 },
    { country_id: 3, entity_id: 4, units: 5 },
    { country_id: 4, entity_id: 1, units: 1 },
    { country_id: 4, entity_id: 3, units: 4 },
  ];

  drillSelectedCountryId: number | null = null;
  drillSelectedEntityId: number | null = null;

  drillEntitiesForCountry(countryId: number): { id: number; name: string; units: number }[] {
    const out: { id: number; name: string; units: number }[] = [];
    for (const e of this.drillEntities) {
      const l = this.drillLinks.find(x => x.country_id === countryId && x.entity_id === e.id);
      if (l) out.push({ id: e.id, name: e.name, units: l.units });
    }
    return out;
  }
  drillUnitsCount(countryId: number | null, entityId: number | null): number {
    if (!countryId || !entityId) return 0;
    const l = this.drillLinks.find(x => x.country_id === countryId && x.entity_id === entityId);
    return l?.units ?? 0;
  }

  subwayPointsForCountry(countryId: number, lineIndex: number): string {
    const indices = this.subwayStationsForCountry(countryId); // already returns station indexes
    const pts: string[] = [];
    for (let k = 0; k < indices.length; k++) {
      const idx = indices[k];
      const x = this.subwayXForStation(idx);
      const y = this.subwayYForLine(lineIndex);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }

  drillCountryName(id: number | null): string {
    if (!id) return '';
    for (const c of this.drillCountries) {
      if (c.id === id) return c.name;
    }
    return '';
  }
  drillEntityName(id: number | null): string {
    if (!id) return '';
    for (const e of this.drillEntities) {
      if (e.id === id) return e.name;
    }
    return '';
  }


  countries: CountryNode[] = [
    {
      id: 1, name: 'Lebanon',
      entities: [
        { id: 1, name: 'BZ', units: [
          { id: 101, name: 'IT', users: 14 },
          { id: 102, name: 'Protection', users: 22 },
          { id: 103, name: 'MEAL', users: 9 },
        ], alsoIn: ['Jordan']},
        { id: 3, name: 'Pioneer', units: [
          { id: 131, name: 'Field Ops', users: 18 },
        ], alsoIn: ['Syria']},
      ]
    },
    {
      id: 2, name: 'Jordan',
      entities: [
        { id: 1, name: 'BZ', units: [
          { id: 121, name: 'IT', users: 7 },
          { id: 122, name: 'Programs', users: 12 },
        ], alsoIn: ['Lebanon']},
        { id: 2, name: 'CSEU', units: [
          { id: 221, name: 'Dev', users: 11 },
          { id: 222, name: 'Ops', users: 6 },
          { id: 223, name: 'Design', users: 5 },
        ]},
      ]
    },
    {
      id: 3, name: 'Iraq',
      entities: [
        { id: 2, name: 'CSEU', units: [
          { id: 231, name: 'Dev', users: 8 },
        ]},
        { id: 4, name: 'Shatila Studio', units: [
          { id: 441, name: 'Media', users: 10 },
        ]},
      ]
    },
    {
      id: 4, name: 'Syria',
      entities: [
        { id: 3, name: 'Pioneer', units: [
          { id: 331, name: 'Field Ops', users: 13 },
          { id: 332, name: 'Logistics', users: 4 },
        ], alsoIn: ['Lebanon']},
      ]
    }
  ];

  // ===== Role chips (emojis in the same 🧑‍💼 family) =====
  roleChips = {
    super_admin:    { icon: '🧑‍💼👑',  text: 'Super Admin',  bg:'bg-amber-50',   fg:'text-amber-700',  br:'border-amber-200' },
    c_level:        { icon: '🧑‍💼🏛️', text: 'Board',       bg:'bg-violet-50',  fg:'text-violet-700', br:'border-violet-200' },
    country_dir:    { icon: '🧑‍💼🌍',  text: 'Country Dir',  bg:'bg-indigo-50',  fg:'text-indigo-700', br:'border-indigo-200' },
    head_of_entity: { icon: '🧑‍💼🏢',  text: 'Head of Entity',bg:'bg-sky-50',     fg:'text-sky-700',    br:'border-sky-200' },
    unit_admin:     { icon: '🧑‍💼🛠️', text: 'Unit Admin',    bg:'bg-emerald-50', fg:'text-emerald-700',br:'border-emerald-200' },
    standard:       { icon: '🧑‍💼',    text: 'Standard Users',bg:'bg-slate-100',  fg:'text-slate-700',  br:'border-slate-200' },
  };

  // Expanded state
  expandedCountries = new Set<number>([1]); // open first by default
  expandedEntities  = new Set<string>();    // key: `${countryId}:${entityId}`

  // Actions
  toggleCountry(id: number): void {
    if (this.expandedCountries.has(id)) this.expandedCountries.delete(id);
    else this.expandedCountries.add(id);
  }
  entityKey(countryId: number, entityId: number): string {
    return `${countryId}:${entityId}`;
  }
  isEntityOpen(countryId: number, entityId: number): boolean {
    return this.expandedEntities.has(this.entityKey(countryId, entityId));
  }
  toggleEntity(countryId: number, entityId: number): void {
    const key = this.entityKey(countryId, entityId);
    if (this.expandedEntities.has(key)) this.expandedEntities.delete(key);
    else this.expandedEntities.add(key);
  }

  // Small helpers
  unitCount(e: EntityNode): number { return e.units ? e.units.length : 0; }
  usersSum(e: EntityNode): number {
    let s = 0;
    if (e.units) for (let i=0;i<e.units.length;i++) s += (e.units[i].users || 0);
    return s;
  }


  // block 5:
  hxCountries: HxCountry[] = [
    {
      id: 1, name: 'Lebanon', country_dirs: ['Layla Haddad'],
      entities: [
        { id: 1, name: 'BZ', heads: ['Nour Saad'], units: [
          { id: 101, name: 'IT',         unit_admins: ['Alaa Zaibak'],     standards: ['Maya T.', 'Rami K.', 'Zeinab S.'] },
          { id: 102, name: 'Protection', unit_admins: ['Hadi M.'],         standards: ['Amal E.', 'Jad B.'] },
          { id: 103, name: 'MEAL',       unit_admins: ['Yara A.'],         standards: ['Ola F.'] },
        ]},
        { id: 3, name: 'Pioneer', heads: ['Walid R.'], units: [
          { id: 131, name: 'Field Ops',  unit_admins: ['Mira K.'],         standards: ['Ali Z.', 'Hussein M.', 'Sara N.'] },
        ]},
      ]
    },
    {
      id: 2, name: 'Jordan', country_dirs: ['Omar Nasser'],
      entities: [
        { id: 1, name: 'BZ', heads: ['Hanin S.'], units: [
          { id: 121, name: 'IT',         unit_admins: ['Sami A.'],         standards: ['Lina D.', 'Omar H.'] },
          { id: 122, name: 'Programs',   unit_admins: ['Reem Y.'],         standards: ['Tala R.', 'Ibrahim Q.', 'Dana J.'] },
        ]},
        { id: 2, name: 'CSEU', heads: ['Firas G.'], units: [
          { id: 221, name: 'Dev',        unit_admins: ['Nadia W.'],        standards: ['Mohannad S.', 'Aya L.'] },
          { id: 222, name: 'Ops',        unit_admins: ['Nour E.'],         standards: ['Khaled A.'] },
          { id: 223, name: 'Design',     unit_admins: ['Yousef R.'],       standards: ['Sahar P.', 'Ruba U.'] },
        ]},
      ]
    },
    {
      id: 3, name: 'Iraq', country_dirs: ['Sara Karim'],
      entities: [
        { id: 2, name: 'CSEU', heads: ['Ola K.'], units: [
          { id: 231, name: 'Dev',        unit_admins: ['Hasan V.'],        standards: ['Maha T.'] },
        ]},
        { id: 4, name: 'Shatila Studio', heads: ['Adel S.'], units: [
          { id: 441, name: 'Media',      unit_admins: ['Reyhan B.'],       standards: ['Rayan C.', 'Hala N.'] },
        ]},
      ]
    },
    {
      id: 4, name: 'Syria', country_dirs: ['Fadi Barakat'],
      entities: [
        { id: 3, name: 'Pioneer', heads: ['Sameer J.'], units: [
          { id: 331, name: 'Field Ops',  unit_admins: ['Kinan T.'],        standards: ['Ola A.', 'Rasha S.'] },
          { id: 332, name: 'Logistics',  unit_admins: ['Joud M.'],         standards: ['Bilal F.'] },
        ]},
      ]
    },
  ];

  // Global roles
  hxSuperAdmins = ['Super Admin A'];
  hxCLevels     = ['Exec One', 'Exec Two'];

  // --- UI State (selected lane) ---
  hxSelectedCountryId: number | null = this.hxCountries[0]?.id ?? null;
  hxSelectedEntityId:  number | null = this.hxCountries[0]?.entities[0]?.id ?? null;

  // --- Expand/collapse sets for showing names when chips are clicked ---
  hxOpenCountryDir = new Set<number>();                 // countryId
  hxOpenEntityHeads = new Set<string>();                // key: `${countryId}:${entityId}`
  hxOpenUnitAdmins = new Set<number>();                 // unitId
  hxOpenUnitStandards = new Set<number>();              // unitId

  // --- Helpers (no arrow functions in templates) ---
  hxCountryById(id: number | null): HxCountry | null {
    if (id == null) return null;
    for (const c of this.hxCountries) if (c.id === id) return c;
    return null;
  }
  hxEntitiesForCountry(id: number | null): HxEntity[] {
    return this.hxCountryById(id)?.entities ?? [];
  }
  hxEntityByIds(countryId: number | null, entityId: number | null): HxEntity | null {
    const c = this.hxCountryById(countryId);
    if (!c || entityId == null) return null;
    for (const e of c.entities) if (e.id === entityId) return e;
    return null;
  }
  hxUnitsForSelection(): HxUnit[] {
    return this.hxEntityByIds(this.hxSelectedCountryId, this.hxSelectedEntityId)?.units ?? [];
  }
  hxEntityKey(countryId: number, entityId: number): string {
    return `${countryId}:${entityId}`;
  }

  // --- Chip toggles ---
  hxToggleCountryDir(countryId: number): void {
    this.hxOpenCountryDir.has(countryId) ? this.hxOpenCountryDir.delete(countryId) : this.hxOpenCountryDir.add(countryId);
  }
  hxToggleEntityHeads(countryId: number, entityId: number): void {
    const k = this.hxEntityKey(countryId, entityId);
    this.hxOpenEntityHeads.has(k) ? this.hxOpenEntityHeads.delete(k) : this.hxOpenEntityHeads.add(k);
  }
  hxToggleUnitAdmins(unitId: number): void {
    this.hxOpenUnitAdmins.has(unitId) ? this.hxOpenUnitAdmins.delete(unitId) : this.hxOpenUnitAdmins.add(unitId);
  }
  hxToggleUnitStandards(unitId: number): void {
    this.hxOpenUnitStandards.has(unitId) ? this.hxOpenUnitStandards.delete(unitId) : this.hxOpenUnitStandards.add(unitId);
  }

  // --- Selectors for lanes ---
  hxSelectCountry(id: number): void {
    this.hxSelectedCountryId = id;
    // reset entity to first in that country
    const ents = this.hxEntitiesForCountry(id);
    this.hxSelectedEntityId = ents.length ? ents[0].id : null;
  }
  hxSelectEntity(id: number): void {
    this.hxSelectedEntityId = id;
  }

  // --- Role chips styles (🧑‍💼 family) ---
  hxChip(role: 'country_dir'|'head_of_entity'|'unit_admin'|'standard') {
    switch (role) {
      case 'country_dir':    return { icon:'🧑‍💼🌍',  bg:'bg-indigo-50',  fg:'text-indigo-700',  br:'border-indigo-200' };
      case 'head_of_entity': return { icon:'🧑‍💼🏢',  bg:'bg-sky-50',     fg:'text-sky-700',     br:'border-sky-200' };
      case 'unit_admin':     return { icon:'🧑‍💼🛠️', bg:'bg-emerald-50', fg:'text-emerald-700', br:'border-emerald-200' };
      default:               return { icon:'🧑‍💼',    bg:'bg-slate-100',  fg:'text-slate-700',   br:'border-slate-200' };
    }
  }

// block 6



  vxCountries: VxCountry[] = [
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

  // Global roles (header)
  vxSuperAdmins = ['Super Admin A'];
  vxCLevels     = ['Exec One', 'Exec Two'];

  // ===== UI State =====
  vxExpandedCountries = new Set<number>([1]); // open first
  vxExpandedEntities  = new Set<string>();    // key: `${countryId}:${entityId}`

  // click-to-reveal name chips
  vxOpenCountryDir    = new Set<number>(); // countryId
  vxOpenEntityHeads   = new Set<string>(); // key: `${countryId}:${entityId}`
  vxOpenUnitAdmins    = new Set<number>(); // unitId
  vxOpenUnitStandards = new Set<number>(); // unitId

  // ===== Helpers (no arrow funcs in templates) =====
  vxEntityKey(countryId: number, entityId: number): string {
    return `${countryId}:${entityId}`;
  }
  vxToggleCountry(id: number): void {
    if (this.vxExpandedCountries.has(id)) this.vxExpandedCountries.delete(id);
    else this.vxExpandedCountries.add(id);
  }
  vxToggleEntity(countryId: number, entityId: number): void {
    const k = this.vxEntityKey(countryId, entityId);
    if (this.vxExpandedEntities.has(k)) this.vxExpandedEntities.delete(k);
    else this.vxExpandedEntities.add(k);
  }
  vxIsEntityOpen(countryId: number, entityId: number): boolean {
    return this.vxExpandedEntities.has(this.vxEntityKey(countryId, entityId));
  }

  // chips toggles
  vxToggleCountryDir(countryId: number): void {
    this.vxOpenCountryDir.has(countryId) ? this.vxOpenCountryDir.delete(countryId) : this.vxOpenCountryDir.add(countryId);
  }
  vxToggleEntityHeads(countryId: number, entityId: number): void {
    const k = this.vxEntityKey(countryId, entityId);
    this.vxOpenEntityHeads.has(k) ? this.vxOpenEntityHeads.delete(k) : this.vxOpenEntityHeads.add(k);
  }
  vxToggleUnitAdmins(unitId: number): void {
    this.vxOpenUnitAdmins.has(unitId) ? this.vxOpenUnitAdmins.delete(unitId) : this.vxOpenUnitAdmins.add(unitId);
  }
  vxToggleUnitStandards(unitId: number): void {
    this.vxOpenUnitStandards.has(unitId) ? this.vxOpenUnitStandards.delete(unitId) : this.vxOpenUnitStandards.add(unitId);
  }

  // tiny stats
  vxUnitCount(e: VxEntity): number { return e.units ? e.units.length : 0; }
  vxUsersSum(e: VxEntity): number {
    let s = 0; if (e.units) for (let i=0;i<e.units.length;i++) s += (e.units[i].standards?.length || 0) + (e.units[i].unit_admins?.length || 0);
    return s;
  }

  // chip styles
  vxChip(role: 'country_dir'|'head_of_entity'|'unit_admin'|'standard') {
    switch (role) {
      case 'country_dir':    return { icon:'🧑‍💼🌍',  bg:'bg-indigo-50',  fg:'text-indigo-700',  br:'border-indigo-200' };
      case 'head_of_entity': return { icon:'🧑‍💼🏢',  bg:'bg-sky-50',     fg:'text-sky-700',     br:'border-sky-200' };
      case 'unit_admin':     return { icon:'🧑‍💼🛠️', bg:'bg-emerald-50', fg:'text-emerald-700', br:'border-emerald-200' };
      default:               return { icon:'🧑‍💼',    bg:'bg-slate-100',  fg:'text-slate-700',   br:'border-slate-200' };
    }
  }
}
