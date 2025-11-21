import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { LogAdminAsset, LogAdminAssetsService } from '../../services/log-admin-assets.service';
import { AssetService } from 'src/app/core/services/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-assets',
  templateUrl: './my-assets.component.html',
  styleUrls: ['./my-assets.component.scss'],
})
export class MyAssetsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

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
  private fetch$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private logAssets: LogAdminAssetsService,
    private assetService: AssetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.assetService.getStatuses().pipe(takeUntil(this.destroy$)).subscribe(statuses => {
      this.statuses = statuses ?? [];
    });

    this.form.valueChanges
      .pipe(
        tap(() => this.resetPaginator()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.fetch$.next());

    this.fetch$
      .pipe(
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.logAssets.getAssets({
            search: this.form.value.search || undefined,
            status_id: this.form.value.status_id || undefined,
            per_page: this.form.value.per_page || 10,
            page: this.paginator ? this.paginator.pageIndex + 1 : 1,
            sort: this.form.value.sort || undefined,
            dir: this.form.value.dir || undefined,
          })
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: res => {
          this.data = res.data;
          this.total = res.meta?.total ?? res.data.length;
          this.loading = false;
        },
        error: () => {
          this.data = [];
          this.total = 0;
          this.loading = false;
        },
      });

    // initial load
    this.fetch$.next();
  }

  ngAfterViewInit(): void {
    this.fetch$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applySearch(): void {
    this.fetch$.next();
  }

  clearFilters(): void {
    this.form.reset({
      search: '',
      status_id: null,
      per_page: 10,
      sort: 'acquisition_date',
      dir: 'desc',
    });
    this.fetch$.next();
  }

  pageChange(event: PageEvent) {
    this.form.patchValue({ per_page: event.pageSize }, { emitEvent: false });
    this.fetch$.next();
  }

  private resetPaginator() {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  navigateToAsset(asset: LogAdminAsset): void {
    if (asset?.id) {
      this.router.navigate(['/assets', asset.id]);
    }
  }

  // Colors handled inline in template to mirror All Assets component
}

