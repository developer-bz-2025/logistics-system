import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { SearchService, ResourceListItemDto, PaginatedResponse } from 'src/app/core/services/search.service';
import { ResourcesService } from 'src/app/core/services/resources.service';


@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html'
})
export class SearchResultsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();


  // State
  q$ = new BehaviorSubject<string>('');
  page$ = new BehaviorSubject<number>(1);
  perPage$ = new BehaviorSubject<number>(20);


  // Optional UI filters (you can add dropdowns bound to these)
  typeId$ = new BehaviorSubject<number | null>(null);
  visibilityId$ = new BehaviorSubject<number | null>(null);
  unitId$ = new BehaviorSubject<number | null>(null);
  entityId$ = new BehaviorSubject<number | null>(null);
  categoryId$ = new BehaviorSubject<number | null>(null);


  loading = false;
  results: ResourceListItemDto[] = [];
  total = 0; currentPage = 1; lastPage = 1; perPage = 20;

  constructor(private route: ActivatedRoute, private router: Router, private search: SearchService,private rs:ResourcesService) {
    // sync from URL
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((p: Params) => {
      const q = (p['q'] ?? '').toString();
      const page = Number(p['page'] ?? 1) || 1;
      this.q$.next(q);
      this.page$.next(page);
    });


    // query stream
    combineLatest([this.q$, this.page$, this.perPage$, this.typeId$, this.visibilityId$, this.unitId$, this.entityId$, this.categoryId$])
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        switchMap(([q, page, per_page, type_id, visibility_id, unit_id, entity_id, category_id]) => {
          this.loading = true;
          return this.search.searchResources({ q, page, per_page, type_id: type_id ?? undefined, visibility_id: visibility_id ?? undefined, unit_id: unit_id ?? undefined, entity_id: entity_id ?? undefined, category_id: category_id ?? undefined });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: PaginatedResponse<ResourceListItemDto>) => {
          this.loading = false;
          this.results = res.data || [];
          this.currentPage = res.meta?.current_page ?? 1;
          this.lastPage = res.meta?.last_page ?? 1;
          this.perPage = res.meta?.per_page ?? this.perPage$.value;
          this.total = res.meta?.total ?? this.results.length;
        },
        error: (err) => {
          this.loading = false;
          console.error('Search failed', err);
          this.results = [];
          this.total = 0; this.currentPage = 1; this.lastPage = 1;
        }
      });
  }


  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }




  // UI handlers
  onPageChange(page: number) {
    const q = this.q$.value;
    this.router.navigate([], { relativeTo: this.route, queryParams: { q, page }, queryParamsHandling: 'merge' });
  }


  openHref(r: ResourceListItemDto) {
    if (!r.res_url) return;
    window.open(r.res_url, '_blank', 'noopener');
  }


  hrefFor(u: string | null | undefined): string | null {
    return this.rs.resolveUrl(u); // <-- uses your existing ResourcesService implementation
  }

  iconForType(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'document': return '📄';
      case 'policy': return '📑';
      case 'system link': return '🖥️';
      case 'useful link': return '🔗';
      default: return '📦';
    }
  }

  visColor(v?: string | null) {
    if (!v) return '#64748b'; // slate-500
    const k = v.toLowerCase();
    if (k.includes('public')) return '#16a34a';
    if (k.includes('global')) return '#2563eb';
    if (k.includes('internal')) return '#f59e0b';
    if (k.includes('confidential')) return '#dc2626';
    return '#64748b';
  }
}