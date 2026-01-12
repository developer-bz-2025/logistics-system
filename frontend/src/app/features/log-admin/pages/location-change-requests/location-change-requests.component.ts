import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LocationChangeRequestsService, LocationChangeRequest } from './location-change-requests.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { RejectDialogComponent } from './reject-dialog.component';

@Component({
  selector: 'app-location-change-requests',
  templateUrl: './location-change-requests.component.html',
  styleUrls: ['./location-change-requests.component.scss']
})
export class LocationChangeRequestsComponent implements OnDestroy {
  requests: LocationChangeRequest[] = [];
  loading = false;
  error: string | null = null;

  status: 'all' | 'Pending' | 'Approved' | 'Rejected' = 'Pending';
  search = '';
  page = 1;
  perPage = 10;
  total = 0;
  lastPage = 1;

  private search$ = new Subject<string>();
  private sub = new Subscription();

  constructor(
    private api: LocationChangeRequestsService,
    private toast: ToastService,
    private dialog: MatDialog,
    private router: Router
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
      status: this.status === 'all' ? undefined : this.status,
      search: this.search,
      page: this.page,
      per_page: this.perPage,
    }).subscribe({
      next: (res) => {
        this.requests = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Failed to load location change requests';
        this.loading = false;
      }
    });
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
    if (p < 1 || p > this.lastPage) return;
    this.page = p;
    this.fetch();
  }

  approve(request: LocationChangeRequest): void {
    if (!confirm(`Approve location change request for item "${request.item.description}"?`)) {
      return;
    }

    this.loading = true;
    this.api.approve(request.id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Request approved successfully');
        this.fetch();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to approve request');
        this.loading = false;
      }
    });
  }

  reject(request: LocationChangeRequest): void {
    const dialogRef = this.dialog.open(RejectDialogComponent, {
      width: '500px',
      data: { request }
    });

    dialogRef.afterClosed().subscribe((result?: { reason: string }) => {
      if (result) {
        this.loading = true;
        this.api.reject(request.id, result.reason).subscribe({
          next: (res) => {
            this.toast.success(res.message || 'Request rejected successfully');
            this.fetch();
          },
          error: (e) => {
            this.toast.error(e?.error?.message || 'Failed to reject request');
            this.loading = false;
          }
        });
      }
    });
  }

  statusClass(status: string): { [key: string]: boolean } {
    const st = (status || '').toLowerCase();
    return {
      'bg-amber-100 text-amber-700': st === 'pending',
      'bg-green-100 text-green-700': st === 'approved',
      'bg-rose-100 text-rose-700': st === 'rejected',
    };
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  }

  navigateToAsset(itemId: number): void {
    if (itemId) {
      this.router.navigate(['/assets', itemId]);
    }
  }
}

