import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs/operators';
import { BrowseQuery, Facets, Paginated, ResourceItem } from '../../core/models/browse';
import { BrowseService } from '../../core/services/browse.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service'; // <-- adjust path

import { JwtService } from 'src/app/core/services/jwt.service';




type Role = 'super_admin'|'c_level'|'country_dir'|'head_of_entity'|'unit_admin'|'standard';

interface UserDto {
  id: number;
  role: Role;
  country_id?: number;
  entity_id?: number;
  unit_id?: number;
  // (other fields you showed are fine to keep here too)
}


@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent {

  // reactive query state
  readonly query$ = new BehaviorSubject<BrowseQuery>({ page: 1, per_page: 20, sort: '-created_at' });

  // lookups
  countries$ = this.browse.countries().pipe(shareReplay(1));
  entities$!: Observable<Array<{entity_id:number;entity_name:string}>>;
  units$!: Observable<Array<{unit_id:number;unit_name:string}>>;
  types$ = this.browse.types().pipe(shareReplay(1));

  // data
  facets$!: Observable<Facets>;
  results$!: Observable<Paginated<ResourceItem>>;

  // current user (async)
  me$!: Observable<UserDto>;
  role$!: Observable<Role>;

  constructor(
    private browse: BrowseService,
    private jwtService: JwtService,
    private users: UserService, // <-- inject your real service
  ) {}

  onTagsBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input?.value || '';
    const tags = raw.split(',').map(s => s.trim()).filter(Boolean);
    this.set('tags', tags);
  }

 

  ngOnInit(): void {
    // 1) Load current user (get the id from your session; adjust helper as needed)
   const userId = this.jwtService.getUserId();
    this.me$ = this.users.getUser(Number(userId)).pipe(
      map((u: any) => ({
        id: u.id,
        role: u.role as Role,
        country_id: u.country_id,
        entity_id: u.entity_id,
        unit_id: u.unit_id,
      })),
      shareReplay(1)
    );
    this.role$ = this.me$.pipe(map(u => u.role));

    // 2) Initialize query defaults once user is known
    this.me$.subscribe(me => {
      const base: BrowseQuery = { page: 1, per_page: 20, sort: '-created_at' };
      if (me.role === 'unit_admin' || me.role === 'standard') base.unit_id = me.unit_id;
      else if (me.role === 'head_of_entity') base.entity_id = me.entity_id;
      else if (me.role === 'country_dir') { base.country_id = me.country_id; base.entity_id = me.entity_id; }
      this.query$.next(base);
    });

    // 3) Dependent lookups react to query
    this.entities$ = this.query$.pipe(
      switchMap(q => this.browse.entities(q.country_id)),
      shareReplay(1)
    );
    this.units$ = this.query$.pipe(
      switchMap(q => this.browse.units(q.entity_id)),
      shareReplay(1)
    );

    // 4) Facets & list react to query
    this.facets$ = this.query$.pipe(switchMap(q => this.browse.facets(q)), shareReplay(1));
    this.results$ = this.query$.pipe(switchMap(q => this.browse.list(q)), shareReplay(1));
  }

  // ---- UI handlers (unchanged) ----
  set<K extends keyof BrowseQuery>(key: K, value: BrowseQuery[K]) {
    const next = { ...this.query$.value, page: 1, [key]: value };
    if (key === 'country_id') { delete next.entity_id; delete next.unit_id; }
    if (key === 'entity_id')  delete next.unit_id;
    this.query$.next(next);
  }
  toggleMulti(current: number[] | undefined, id: number): number[] {
    const set = new Set(current ?? []);
    set.has(id) ? set.delete(id) : set.add(id);
    return Array.from(set);
  }
  setTypeToggle(id: number) { this.set('type_id', this.toggleMulti(this.query$.value.type_id, id)); }
  setVisToggle(id: number)  { this.set('visibility_id', this.toggleMulti(this.query$.value.visibility_id, id)); }

  setSearchImmediate(value: string) { /* debounce in template if desired */ this.set('search', value.trim() || undefined); }

  setDates(range: { from?: string; to?: string }) {
    const q = { ...this.query$.value, page: 1 };
    q.date_from = range.from || undefined;
    q.date_to = range.to || undefined;
    this.query$.next(q);
  }
  pageTo(p: number) { if (p >= 1) this.query$.next({ ...this.query$.value, page: p }); }
  perPage(n: number) { this.query$.next({ ...this.query$.value, page: 1, per_page: n }); }
  sortBy(s: string)  { this.query$.next({ ...this.query$.value, page: 1, sort: s }); }
  resolveUrl(r: ResourceItem) { return r.res_url || '#'; }
  iconFor(r: ResourceItem) { return r.res_type_id === 2 ? '📘' : r.res_type_id === 3 ? '🔗' : r.res_type_id === 4 ? '🔖' : '📄'; }

  // Helper: replace with your real session source (JWT/localStorage/etc.)
  private getCurrentUserId(): number {
    // Example 1: if stored after login
    const raw = localStorage.getItem('user_id');
    if (raw) return +raw;

    // Example 2: if you stored the whole user object
    const u = localStorage.getItem('user');
    if (u) try { return JSON.parse(u).id; } catch {}

    // Example 3: decode JWT payload (if available) to read `id` or `sub`
    // const token = localStorage.getItem('access_token'); decode and return id...

    // Fallback (dev): hardcode or throw
    throw new Error('No current user id found. Wire getCurrentUserId() to your auth flow.');
  }
  onDateFromChange(event: Event) {
    const val = (event.target as HTMLInputElement).value || undefined;
    this.setDates({ from: val, to: this.query$.value?.date_to });
  }
  
  onDateToChange(event: Event) {
    const val = (event.target as HTMLInputElement).value || undefined;
    this.setDates({ from: this.query$.value?.date_from, to: val });
  }
}
