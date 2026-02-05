import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil, combineLatest, startWith, map, switchMap, tap, defer, BehaviorSubject, distinctUntilChanged, debounceTime } from 'rxjs';
import { LogAdminAsset, LogAdminAssetsService } from '../../services/log-admin-assets.service';
import { AssetService, CategoryService } from 'src/app/core/services/category.service';
import { Router } from '@angular/router';

type DashboardCardKey = 'furniture'|'appliances'|'machine'|'vehicle'|'electronics'|'it'|'computer';

type ExternalCard = {
  key: DashboardCardKey;
  label?: string;
  count: number;
  tint?: 'indigo'|'green'|'violet'|'orange'|'rose'|'teal'|'cyan';
  categoryId?: number;
};

@Component({
  selector: 'app-my-assets',
  templateUrl: './my-assets.component.html',
  styleUrls: ['./my-assets.component.scss'],
})
export class MyAssetsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;



  // inside component class
  stats: any = null;
statsCards: Array<{ key: string; label?: string; count: number; route?: string; categoryId?: number }> = [];  
  form = this.fb.group({
    search: [''],
    status_id: [null as number | null],
    per_page: [10],
    sort: ['acquisition_date'],
    dir: ['desc' as 'asc' | 'desc'],
  });

  displayedColumns = ['sn', 'fixed_item', 'acquisition_date', 'status', 'location', 'brand'];
  data: LogAdminAsset[] = [];

  total = 0;
  loading = false;
  statuses: any[] = [];
  

  

  private destroy$ = new Subject<void>();
  private pageState$ = new BehaviorSubject<{ page: number; pageSize: number }>({ page: 1, pageSize: 10 });

  constructor(
    private fb: FormBuilder,
    private logAssets: LogAdminAssetsService,
    private assetService: AssetService,
    private categoryService: CategoryService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.assetService.getStatuses().pipe(takeUntil(this.destroy$)).subscribe(statuses => {
      this.statuses = statuses ?? [];
    });

    // Track previous filter values to detect filter-only changes
    let previousFilters: Partial<typeof this.form.value> = {
      search: this.form.value.search,
      status_id: this.form.value.status_id,
      sort: this.form.value.sort,
      dir: this.form.value.dir,
      per_page: this.form.value.per_page,
    };

    // Watch form changes and reset page when filters change (not per_page)
    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(100),
      distinctUntilChanged((prev, curr) =>
        prev.search === curr.search &&
        prev.status_id === curr.status_id &&
        prev.sort === curr.sort &&
        prev.dir === curr.dir &&
        prev.per_page === curr.per_page
      )
    ).subscribe(formValue => {
      const filtersChanged =
        formValue.search !== previousFilters.search ||
        formValue.status_id !== previousFilters.status_id ||
        formValue.sort !== previousFilters.sort ||
        formValue.dir !== previousFilters.dir;

      if (filtersChanged) {
        // Reset to page 1 when filters change
        this.pageState$.next({ page: 1, pageSize: formValue.per_page || 10 });
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.firstPage();
          }
        }, 0);
      } else if (formValue.per_page !== previousFilters.per_page) {
        // Update pageSize when per_page changes, but keep current page
        this.pageState$.next({
          page: this.pageState$.value.page,
          pageSize: formValue.per_page || 10
        });
      }

      previousFilters = { ...formValue };
    });

    // Use the same pattern as assets-list: combineLatest with defer and form.valueChanges
    combineLatest([
      this.pageState$.asObservable(),
      defer(() => this.form.valueChanges.pipe(
        startWith(this.form.value),
        tap(() => {
          // Clear data immediately when any filter changes
          this.data = [];
          this.total = 0;
        })
      ))
    ])
      .pipe(
        map(([pageState, form]) => {
          const params: any = {
            search: form.search,
            status_id: form.status_id,
            sort: form.sort || 'acquisition_date',
            dir: form.dir || 'desc',
            page: pageState.page,
            per_page: pageState.pageSize,
          };
          // Remove null/undefined/empty values
          Object.keys(params).forEach((key: string) => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
              delete params[key];
            }
          });
          return params;
        }),
        switchMap(params => {
          this.loading = true;
          return this.logAssets.getAssets(params);
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('Full API Response:', JSON.stringify(res, null, 2));
          console.log('res.data:', res.data);
          console.log('res.meta:', res.meta);
          console.log('(res as any).total:', (res as any).total);
          this.data = res.data || [];
          // Handle both response structures: meta.total or direct total
          this.total = (res as any).total ?? res.meta?.total ?? 0;
          console.log('Final total set to:', this.total);
          this.loading = false;
          // Sync paginator with current pageState after data loads
          setTimeout(() => {
            if (this.paginator) {
              const currentState = this.pageState$.value;
              this.paginator.pageIndex = currentState.page - 1;
              this.paginator.pageSize = currentState.pageSize;
            }
          }, 0);
        },
        error: (err) => {
          console.error('Error fetching assets:', err);
          this.data = [];
          this.total = 0;
          this.loading = false;
        }
      });
    this.loadLogAdminStats();
  }

  loadLogAdminStats() {
    this.assetService.getLogAdminStats().subscribe({
      next: (res: any) => {
        const stats = res?.data ?? res ?? {};
        const apiToCardKey: Record<string, ExternalCard['key']> = {
          appliances: 'appliances',
          electronics: 'electronics',
          furniture: 'furniture',
          it_equipment: 'it',
          machine: 'machine',
          vehicle: 'vehicle'
        };
  
        // Build externalCards array using dashboard keys
        const externalCards = Object.values({
          furniture: { key: 'furniture' as const },
          appliances: { key: 'appliances' as const },
          machine: { key: 'machine' as const },
          vehicle: { key: 'vehicle' as const },
          electronics: { key: 'electronics' as const },
          computer: { key: 'computer' as const },
          it: { key: 'it' as const }
        }).map(def => {
          // find api key mapped to this card key
          const apiKey = Object.keys(apiToCardKey).find(k => apiToCardKey[k] === def.key);
          const count = apiKey ? Number(stats[apiKey] ?? 0) : 0;
          return { key: def.key, count };
        });
  
        // assign to input bound to <app-dashboard-cards>
        this.statsCards = externalCards;
        // optionally resolve categoryId afterwards (if you want click to filter)
        this.categoryService.getCategories().subscribe(categories => {
          const nameMap: Record<string, string[]> = {
            furniture: ['Furniture'],
            appliances: ['Appliances'],
            machine: ['Machine','Machines'],
            vehicle: ['Vehicle','Vehicles'],
            electronics: ['Electronics'],
            computer: ['Computer','Computers'],
            it: ['IT Equipment','IT']
          };
          this.statsCards = this.statsCards.map(card => {
            const names = nameMap[card.key] ?? [];
            const cat = categories.find(c => names.some(n => c.name.toLowerCase().includes(n.toLowerCase())));
            return { ...card, categoryId: cat?.id };
          });
        });
      },
      error: err => console.error('Failed to load log-admin stats', err)
    });
  }

  ngAfterViewInit(): void {
    // Ensure paginator is initialized and synced with pageState
    setTimeout(() => {
      if (this.paginator) {
        const currentState = this.pageState$.value;
        this.paginator.pageSize = currentState.pageSize;
        this.paginator.pageIndex = currentState.page - 1;
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applySearch(): void {
    // Reset to first page when search changes
    this.pageState$.next({ page: 1, pageSize: this.form.value.per_page || 10 });
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.firstPage();
      }
    }, 0);
  }

  clearFilters(): void {
    this.form.reset({
      search: '',
      status_id: null,
      per_page: 10,
      sort: 'acquisition_date',
      dir: 'desc',
    });
    this.pageState$.next({ page: 1, pageSize: 10 });
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.firstPage();
      }
    }, 0);
  }

  pageChange(event: PageEvent) {
    // Update the form's per_page control to keep it in sync
    this.form.patchValue({ per_page: event.pageSize }, { emitEvent: false });
    // Update page state which triggers the data fetch
    this.pageState$.next({
      page: event.pageIndex + 1,
      pageSize: event.pageSize
    });
  }

  navigateToAsset(asset: LogAdminAsset): void {
    if (asset?.id) {
      this.router.navigate(['/assets', asset.id]);
    }
  }
}

