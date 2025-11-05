import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PrEditRequestsService } from './pr-edit-requests.service';
import { HeaderDiffs, Paged, PrEditRequestRow } from './models';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-pr-edit-requests',
  templateUrl: './pr-edit-requests.component.html',
  styleUrls: ['./pr-edit-requests.component.scss']
})
export class PrEditRequestsComponent implements OnDestroy {
  rows: PrEditRequestRow[] = [];
  loading = false;
  error: string | null = null;

  status: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  search = '';
  page = 1;
  perPage = 10;
  total = 0;

  private search$ = new Subject<string>();
  private sub = new Subscription();

  constructor(
    private api: PrEditRequestsService,
    private router: Router,
    private toast: ToastService
  ) {
    this.sub.add(
      this.search$.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => { this.page = 1; this.fetch(); })
    );
    this.fetch();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  fetch(): void {
    this.loading = true;
    this.error = null;

    this.api.list({
      status: this.status,
      search: this.search,
      page: this.page,
      per_page: this.perPage,
      sort: 'created_at',
      order: 'desc',
    }).subscribe({
      next: (res: Paged<PrEditRequestRow>) => {
        this.rows = res.data ?? [];
        // meta.total may be number | number[]
        const m = res.meta || {};
        const asNum = (v: any) => Array.isArray(v) ? (v[0] ?? 0) : (v ?? 0);
        this.total = asNum(m.total);
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Failed to load edit requests';
        this.loading = false;
      }
    });
  }

  onReview(row: PrEditRequestRow) {
    this.router.navigate(['/dashboard/pr-edit-requests', row.id]); // or your route
  }

  onSearchEnter() { this.page = 1; this.fetch(); }
  onSearchInput(val: string) { this.search = val; this.search$.next(val); }
  onFilterChange() { this.page = 1; this.fetch(); }
  onPageChange(p: number) { if (p < 1) return; this.page = p; this.fetch(); }

  // ---- helpers for template ----
  toLcStatus(s: string): 'pending' | 'approved' | 'rejected' | string {
    return (s || '').toLowerCase();
  }

  statusClass(s: string) {
    const st = this.toLcStatus(s);
    return {
      'bg-amber-100 text-amber-700': st === 'pending',
      'bg-green-100 text-green-700': st === 'approved',
      'bg-rose-100 text-rose-700': st === 'rejected',
    };
  }

  changed<T>(oldVal: T, newVal: T): boolean {
    return oldVal !== newVal;
  }

  priceDelta(diffs: HeaderDiffs): number {
    const oldVal = diffs.total_price.old ?? 0;
    const newVal = diffs.total_price.new ?? 0;
    return newVal - oldVal;
  }

  deltaClass(delta: number) {
    return {
      'text-green-700': delta > 0,
      'text-rose-700': delta < 0,
      'text-gray-700': delta === 0,
    };
  }

  docUrl(pr_path: string): string | null {
    const raw = (pr_path || '').trim();
    if (!raw) return null;
  
    // If backend already sent an absolute URL, just return it.
    if (/^https?:\/\//i.test(raw)) return raw;
  
    // Normalize: remove leading slashes
    const path = raw.replace(/^\/+/, '');
  
    // For Laravel public disk, the public URL is usually /storage/<path>
    // If the value doesn't already begin with 'storage/', prefix it.
    const rel = path.startsWith('storage/') ? path : `storage/${path}`;
  
    // Build an absolute URL based on current domain (localhost in dev, real domain in prod)
    return new URL(rel, window.location.origin + '/').toString();
  }
}
