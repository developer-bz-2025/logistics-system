import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ItemEditRequestsService } from './item-edit-requests.service';
import { ItemEditRequestRow, PagedItemEditRequests } from './models';

@Component({
  selector: 'app-item-edit-requests',
  templateUrl: './item-edit-requests.component.html',
  styleUrls: ['./item-edit-requests.component.scss']
})
export class ItemEditRequestsComponent implements OnDestroy {
  rows: ItemEditRequestRow[] = [];
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
    private api: ItemEditRequestsService,
    private router: Router
  ) {
    this.sub.add(
      this.search$.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => {
          this.page = 1;
          this.fetch();
        })
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
    }).subscribe({
      next: (res: PagedItemEditRequests) => {
        this.rows = res.data ?? [];
        const m = res.meta || {};
        const asNum = (v: any) => (Array.isArray(v) ? (v[0] ?? 0) : (v ?? 0));
        this.total = asNum(m.total) || res.total || 0;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Failed to load item edit requests';
        this.loading = false;
      }
    });
  }

  onReview(row: ItemEditRequestRow) {
    this.router.navigate(['/dashboard/item-edit-requests', row.id]);
  }

  onSearchEnter() {
    this.page = 1;
    this.fetch();
  }

  onSearchInput(val: string) {
    this.search = val;
    this.search$.next(val);
  }

  onFilterChange() {
    this.page = 1;
    this.fetch();
  }

  onPageChange(p: number) {
    if (p < 1) return;
    this.page = p;
    this.fetch();
  }

  toLcStatus(s: string): string {
    return (s || '').toLowerCase();
  }

  statusClass(s: string) {
    const st = this.toLcStatus(s);
    return {
      'bg-amber-100 text-amber-700': st === 'pending' || st === 'pending approval',
      'bg-green-100 text-green-700': st === 'approved',
      'bg-rose-100 text-rose-700': st === 'rejected',
    };
  }
}
