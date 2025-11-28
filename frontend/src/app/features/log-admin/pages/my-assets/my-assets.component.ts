import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil, tap } from 'rxjs';
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
  private rawData: LogAdminAsset[] = [];

  total = 0;
  loading = false;
  statuses: any[] = [];

  private destroy$ = new Subject<void>();

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
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.resetPaginator();
        this.applyClientFilter();
      });

    this.loadAssets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applySearch(): void {
    this.applyClientFilter();
  }

  clearFilters(): void {
    this.form.reset({
      search: '',
      status_id: null,
      per_page: 10,
      sort: 'acquisition_date',
      dir: 'desc',
    });
    this.applyClientFilter();
  }

  pageChange(event: PageEvent) {
    this.form.patchValue({ per_page: event.pageSize }, { emitEvent: false });
    this.applyClientFilter();
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

  private applyClientFilter(): void {
    const term = (this.form.value.search || '').toLowerCase().trim();
    const statusId = this.form.value.status_id;
    const sort = this.form.value.sort;
    const dir = this.form.value.dir || 'desc';

    let filtered = this.rawData.filter(asset => {
      const matchesStatus = statusId
        ? asset.status?.id === statusId || asset.status_id === statusId
        : true;
      const fields = [asset.sn, asset.fixed_item_name || asset.fixed_item];
      const matchesSearch = term
        ? fields.some(value => value?.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesSearch;
    });

    if (sort) {
      filtered = filtered.sort((a, b) => {
        const aVal = this.getSortValue(a, sort);
        const bVal = this.getSortValue(b, sort);
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return dir === 'asc' ? -1 : 1;
        if (bVal === null || bVal === undefined) return dir === 'asc' ? 1 : -1;
        if (aVal > bVal) return dir === 'asc' ? 1 : -1;
        return dir === 'asc' ? -1 : 1;
      });
    }

    this.data = filtered;
    this.total = filtered.length;
  }

  private loadAssets(): void {
    this.loading = true;
    this.logAssets
      .getAssets({ per_page: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.rawData = res.data || [];
          this.applyClientFilter();
          this.loading = false;
        },
        error: () => {
          this.rawData = [];
          this.data = [];
          this.total = 0;
          this.loading = false;
        },
      });
  }

  private getSortValue(asset: LogAdminAsset, sort: string): any {
    switch (sort) {
      case 'sn':
        return asset.sn ?? '';
      case 'fixed_item':
        return asset.fixed_item_name || asset.fixed_item || '';
      case 'acquisition_date':
        return asset.acquisition_date ? new Date(asset.acquisition_date).getTime() : null;
      case 'status':
        return asset.status?.name || '';
      case 'location':
        return asset.location?.name || '';
      case 'brand':
        return asset.brand || '';
      default:
        return asset[sort as keyof LogAdminAsset] ?? '';
    }
  }
}

