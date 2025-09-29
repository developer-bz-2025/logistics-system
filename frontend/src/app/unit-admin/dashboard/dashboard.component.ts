import { Component, OnInit } from '@angular/core';
import { map, startWith  } from 'rxjs/operators';
import { Observable, of, combineLatest } from 'rxjs';
import { ResourcesService, UnitDashboardStats } from 'src/app/core/services/resources.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { Router } from '@angular/router';



interface CardVM {
  label: string;
  value: number;
  icon: string;
  bgColor: string;
  textColor: string;
}




type RingSlice = { label: string; value: number; color: string };

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  stats$!: Observable<UnitDashboardStats>;
  total$!: Observable<number>;
  typeSlices$!: Observable<RingSlice[]>;
  visSlices$!: Observable<RingSlice[]>;
  typeBadges$!: Observable<{ label: string; count: number; color: string }[]>;

  usersCount$!:Observable<number>;
  cards$!: Observable<CardVM[]>;

  // Color palettes (Tailwind-ish hex — used in SVG)
  private typeColors: Record<string, string> = {
    'Document':     '#3b82f6', // blue-500
    'Policy':       '#ef4444', // red-500
    'System Link':  '#10b981', // emerald-500
    'Useful Link':  '#8b5cf6', // violet-500
    'Other':        '#6b7280', // gray-500
  };
  private visColors: Record<string, string> = {
    'Global':       '#f59e0b', // amber-500
    'Public':       '#10b981', // emerald-500
    'Internal':     '#3b82f6', // blue-500
    'Confidential': '#ef4444', // red-500
    'Other':        '#6b7280', // gray-500
  };

  dashboardCards = [
    { label: 'Users', value: '-', icon: '👤', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'Resources', value: '-', icon: '📦', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  ];

  constructor(
    private router : Router,
    private rs: ResourcesService,
    private auth: AuthService,
    private usersSvc: UserService
  ) {}

  ngOnInit(): void {
    const unitId = this.auth.user()?.unit_id ?? null;

    // 1) Always init stats$ so total$ can emit
    this.stats$ = unitId
      ? this.rs.getUnitDashboard(unitId)
      : of({ totals: { total_resources: 0 }, byType: [], byVisibility: [] });
  
    // 2) Seed with startWith so combineLatest can emit immediately
    this.total$ = this.stats$.pipe(
      map(s => s?.totals?.total_resources ?? 0),
      startWith(0)
    );
  
    this.usersCount$ = unitId
      ? this.usersSvc.countUnitUsers(unitId).pipe(startWith(0))
      : of(0);
  
    // 3) Build cards AFTER the above are defined
    this.cards$ = combineLatest([this.usersCount$, this.total$]).pipe(
      map(([users, resources]) => ([
        { label: 'Users',     value: users,     icon: '👤', bgColor: 'bg-blue-50',   textColor: 'text-blue-600' },
        { label: 'Resources', value: resources, icon: '📦', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
      ]))
    );

    if (!unitId) {
      // Fallback: empty state so template renders gracefully
      const empty: UnitDashboardStats = {
        totals: { total_resources: 0 },
        byType: [],
        byVisibility: [],
      };
      this.stats$ = of(empty);
    } else {
      this.stats$ = this.rs.getUnitDashboard(unitId);
    }

    this.total$ = this.stats$.pipe(map(s => s.totals.total_resources || 0));

    // Build ring slices for Type
    this.typeSlices$ = this.stats$.pipe(
      map(s => this.normalizeSlices(
        s.byType.map(x => ({ label: x.type, value: x.count, color: this.typeColors[x.type] || this.typeColors['Other'] }))
      ))
    );

    // Build ring slices for Visibility
    this.visSlices$ = this.stats$.pipe(
      map(s => this.normalizeSlices(
        s.byVisibility.map(x => ({ label: x.visibility, value: x.count, color: this.visColors[x.visibility] || this.visColors['Other'] }))
      ))
    );

    // Badges under Type card
    this.typeBadges$ = this.stats$.pipe(
      map(s => s.byType.map(x => ({
        label: x.type,
        count: x.count,
        color: this.typeColors[x.type] || this.typeColors['Other']
      })))
    );
  }

  

  // ---- Mini ring chart helpers (pure SVG) ----

  /**
   * Ensure there is at least one slice, sum > 0, and cap N
   */
  private normalizeSlices(slices: RingSlice[], maxSlices = 8): RingSlice[] {
    const filtered = slices.filter(s => s.value > 0).slice(0, maxSlices);
    const sum = filtered.reduce((a, b) => a + b.value, 0);
    if (sum === 0) return [{ label: 'Empty', value: 1, color: '#e5e7eb' }]; // gray-200
    return filtered;
  }

  /**
   * Build stroke-dasharray for each slice of a circle with given circumference.
   * Each slice returns { dasharray, dashoffset, color, label, value, percentText }
   */
  buildRingData(slices: RingSlice[], radius = 22) {
    const C = 2 * Math.PI * radius;
    const total = slices.reduce((a, b) => a + b.value, 0);
    let acc = 0;
    return slices.map(s => {
      const f = s.value / total;
      const len = f * C;
      const dasharray = `${len} ${C - len}`;
      const dashoffset = C - acc * C; // start position (accumulated)
      acc += f;
      return {
        color: s.color,
        label: s.label,
        value: s.value,
        dasharray,
        dashoffset,
        percentText: Math.round(f * 100) + '%'
      };
    });
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }
// unit-admin-dashboard.component.ts (inside the class)

// Separate tooltip states
tooltipType = { show: false, x: 0, y: 0, label: '', value: 0 };
tooltipVis  = { show: false, x: 0, y: 0, label: '', value: 0 };

// Position helpers use the *chart's own* ring-box so they don't interfere
private _placeTooltip(evt: MouseEvent, box: HTMLElement) {
  const rect = box.getBoundingClientRect();
  const x = Math.min(Math.max(evt.clientX - rect.left + 12, 8), rect.width - 8);
  const y = Math.min(Math.max(evt.clientY - rect.top  + 12, 8), rect.height - 8);
  return { x, y };
}

// TYPE events
onTypeEnter(evt: MouseEvent, label: string, value: number) {
  const box = (evt.currentTarget as SVGElement).closest('.ring-box') as HTMLElement;
  const { x, y } = this._placeTooltip(evt, box);
  this.tooltipType = { show: true, x, y, label, value };
}
onTypeMove(evt: MouseEvent, label: string, value: number) {
  const box = (evt.currentTarget as SVGElement).closest('.ring-box') as HTMLElement;
  const { x, y } = this._placeTooltip(evt, box);
  this.tooltipType = { show: true, x, y, label, value };
}
onTypeLeave() {
  this.tooltipType.show = false;
}

// VISIBILITY events
onVisEnter(evt: MouseEvent, label: string, value: number) {
  const box = (evt.currentTarget as SVGElement).closest('.ring-box') as HTMLElement;
  const { x, y } = this._placeTooltip(evt, box);
  this.tooltipVis = { show: true, x, y, label, value };
}
onVisMove(evt: MouseEvent, label: string, value: number) {
  const box = (evt.currentTarget as SVGElement).closest('.ring-box') as HTMLElement;
  const { x, y } = this._placeTooltip(evt, box);
  this.tooltipVis = { show: true, x, y, label, value };
}
onVisLeave() {
  this.tooltipVis.show = false;
}


}
