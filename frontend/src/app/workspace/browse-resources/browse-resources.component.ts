import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, switchMap, tap, finalize } from 'rxjs/operators';
import { ResourcesService, TypeNode } from 'src/app/core/services/resources.service';
import { AuthService } from 'src/app/core/services/auth.service';

type Scope = { country_id?: number; entity_id?: number; unit_id?: number };

@Component({
  selector: 'app-browse-resources',
  templateUrl: './browse-resources.component.html',
  styleUrls: ['./browse-resources.component.scss']
})
export class BrowseResourcesComponent implements OnInit {
  scope$ = new BehaviorSubject<Scope>({});
  isLoadingEntities$ = new BehaviorSubject<boolean>(false);
  isLoadingUnits$    = new BehaviorSubject<boolean>(false);

  // Lookups (entities depend on country; units depend on country+entity)
  countries$ = this.rs.getCountries().pipe(shareReplay(1));

  // entities$  = this.scope$.pipe(
  //   switchMap(s => s.country_id ? this.rs.getEntities(s.country_id) : of([])),
  //   shareReplay(1)
  // );

  // units$     = this.scope$.pipe(
  //   switchMap(s => (s.country_id && s.entity_id) ? this.rs.getUnits(s.entity_id, s.country_id) : of([])),
  //   shareReplay(1)
  // );

  entities$ = this.scope$.pipe(
    map(s => s.country_id ?? null),
    distinctUntilChanged(),
    switchMap(cid => {
      if (!cid) return of([] as Array<{id:number;name:string}>);
      this.isLoadingEntities$.next(true);
      return this.rs.getEntities(cid).pipe(
        finalize(() => this.isLoadingEntities$.next(false))
      );
    }),
    shareReplay(1)
  );
  
  units$ = this.scope$.pipe(
    map(s => ({ cid: s.country_id ?? null, eid: s.entity_id ?? null })),
    distinctUntilChanged((a, b) => a.cid === b.cid && a.eid === b.eid),
    switchMap(({ cid, eid }) => {
      if (!cid || !eid) return of([] as Array<{ id:number; name:string }>);
      this.isLoadingUnits$.next(true);
      return this.rs.getUnits(eid, cid).pipe(
        finalize(() => this.isLoadingUnits$.next(false))
      );
    }),
    shareReplay(1)
  );

  // derived disabled states (use in template via async)
disableEntity$ = combineLatest([this.scope$, this.isLoadingEntities$]).pipe(
  map(([s, loading]) => !s.country_id || loading),
  shareReplay(1)
);

disableUnit$ = combineLatest([this.scope$, this.isLoadingUnits$]).pipe(
  map(([s, loading]) => !s.country_id || !s.entity_id || loading),
  shareReplay(1)
);

  // Data
  tree$!: Observable<TypeNode[]>;
  loading = false;
  errorMsg = '';

  typeColors: Record<string, string> = {
    Document: '#3b82f6', Policy: '#ef4444', 'System Link': '#10b981', 'Useful Link': '#8b5cf6', Other: '#6b7280',
  };
  visColors: Record<string, string> = {
    Global: '#f59e0b', Public: '#10b981', Internal: '#3b82f6', Confidential: '#ef4444', Other: '#6b7280',
  };

  constructor(private rs: ResourcesService, private auth: AuthService) {}

  ngOnInit(): void {
    const me = this.auth.user();
    if (me?.country_id) {
      this.scope$.next({ ...this.scope$.value, country_id: me.country_id });
    }
  
    // ENTITIES: load when country changes (show spinner)
    // this.entities$ = this.scope$.pipe(
    //   map(s => s.country_id ?? null),
    //   distinctUntilChanged(),
    //   switchMap(cid => {
    //     if (!cid) return of([] as Array<{id:number;name:string}>);
    //     this.isLoadingEntities$.next(true);
    //     return this.rs.getEntities(cid).pipe(
    //       finalize(() => this.isLoadingEntities$.next(false))
    //     );
    //   }),
    //   shareReplay(1)
    // );
  
    // // UNITS: load when entity changes (show spinner)
    // this.units$ = this.scope$.pipe(
    //   map(s => s.entity_id ?? null),
    //   distinctUntilChanged(),
    //   switchMap(eid => {
    //     if (!eid) return of([] as Array<{id:number;name:string}>);
    //     this.isLoadingUnits$.next(true);
    //     return this.rs.getUnits(eid).pipe(
    //       finalize(() => this.isLoadingUnits$.next(false))
    //     );
    //   }),
    //   shareReplay(1)
    // );
  
    // TREE: fetch when unit is chosen
    this.tree$ = this.scope$.pipe(
      distinctUntilChanged(
        (a, b) => a.country_id===b.country_id && a.entity_id===b.entity_id && a.unit_id===b.unit_id
      ),
      filter(s => !!s.unit_id),
      tap(() => { this.loading = true; this.errorMsg = ''; }),
      switchMap(s =>
        this.rs.resourceBrowse(s.unit_id!).pipe(
          map((res: any) => (Array.isArray(res) ? res : (res?.data ?? [])) as TypeNode[]),
          map(arr => arr.map(t => ({
            ...t,
            categories: Array.isArray(t.categories)
              ? t.categories.map(c => ({ ...c, resources: Array.isArray(c.resources) ? c.resources : [] }))
              : []
          }))),
          catchError(err => {
            this.errorMsg = err?.error?.message || 'Failed to load resources';
            return of<TypeNode[]>([]);
          }),
          finalize(() => { this.loading = false; })
        )
      ),
      shareReplay(1)
    );
  }
  

  private toNum(v: any): number | undefined {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  

  

  // Handlers
  onCountryChange(raw: any) {
    const country_id = this.toNum(raw);
    // reset entity & unit when country changes
    this.scope$.next({ country_id, entity_id: undefined, unit_id: undefined });
  }

  onEntityChange(raw: any) {
    const entity_id = this.toNum(raw);
    const curr = this.scope$.value;
    // reset unit when entity changes
    this.scope$.next({ ...curr, entity_id, unit_id: undefined });
  }

  onUnitChange(raw: any) {
    const unit_id = this.toNum(raw);
    const curr = this.scope$.value;
    this.scope$.next({ ...curr, unit_id });
  }

  // private toNum(v: any): number | undefined {
  //   const n = +v;
  //   return Number.isFinite(n) && n > 0 ? n : undefined;
  //   }

    nameById(list: Array<{id:number;name:string}> | null | undefined, id?: number): string {
      if (!list || !id) return '—';
      const item = list.find(x => x.id === id);
      return item?.name ?? '—';
    }
}
