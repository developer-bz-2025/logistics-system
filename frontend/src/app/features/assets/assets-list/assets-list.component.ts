import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { combineLatest, defer, map, startWith, Subject, switchMap, takeUntil, tap, shareReplay } from 'rxjs';
import { AssetService, CategoryService } from 'src/app/core/services/category.service';
import { Category, SubCategory, FixedItem, AssetListItem, PagedResult } from 'src/app/core/models/reference';
import { ImportExcelService } from 'src/app/core/services/import-excel.service';
import { HttpEventType } from '@angular/common/http';


@Component({
  selector: 'app-assets-list',
  templateUrl: './assets-list.component.html',
  styleUrls: ['./assets-list.component.scss']
})
export class AssetsListComponent  implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  subs: SubCategory[] = [];
  fixedItems: FixedItem[] = [];
  statuses: any[] = [];
  locations: any[] = [];
  floors: any[] = [];
  suppliers: any[] = [];
  holders: any[] = [];
  dynamicAttributes: any[] = [];

  data: AssetListItem[] = [];
  total = 0;
  currentCategoryId: number | null = null;
  currentCategoryName: string = '';
  isLoadingCategoryName: boolean = false;

  // Loading states
  isLoadingAssets = false;
  isLoadingFilters = false;
  isLoadingCategories = false;

  displayedColumns = ['id', 'sn', 'fixed_item', 'acquisition_date', 'status', 'location', 'brand'];
  dynamicColumns: string[] = [];

  private updateDisplayedColumns() {
    // Start with static columns
    const staticColumns = ['id', 'sn', 'fixed_item', 'acquisition_date', 'status', 'location', 'brand'];
    
    // Add valid dynamic attribute columns
    const dynamicCols = this.dynamicAttributes
      .filter(attr => attr.field_name)
      .map(attr => attr.field_name);

    this.displayedColumns = [...staticColumns, ...dynamicCols];
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  form = this.fb.group({
    sub_category_id: [null as number | null],
    fixed_item_id: [null as number | null],
    status_id: [null as number | null],
    location_id: [null as number | null],
    floor_id: [null as number | null],
    supplier_id: [null as number | null],
    holder_user_id: [null as number | null],
    search: [''],
    pageSize: [10],
  });

  sortState: Sort = { active: 'created_at', direction: 'desc' };

   progress = 0;
  isUploading = false;
  message = '';

    readonly withCredentials = false;


  constructor(
    private fb: FormBuilder,
    private cats: CategoryService,
    private assets: AssetService,
    private route: ActivatedRoute,
    private importer: ImportExcelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // First, initialize form with URL values
    const initialQp = this.route.snapshot.queryParamMap;
    const initialValues = {
      sub_category_id: initialQp.get('sub_category_id') ? Number(initialQp.get('sub_category_id')) : null,
      fixed_item_id: initialQp.get('fixed_item_id') ? Number(initialQp.get('fixed_item_id')) : null,
      status_id: initialQp.get('status_id') ? Number(initialQp.get('status_id')) : null,
      location_id: initialQp.get('location_id') ? Number(initialQp.get('location_id')) : null,
      floor_id: initialQp.get('floor_id') ? Number(initialQp.get('floor_id')) : null,
      supplier_id: initialQp.get('supplier_id') ? Number(initialQp.get('supplier_id')) : null,
      holder_user_id: initialQp.get('holder_user_id') ? Number(initialQp.get('holder_user_id')) : null,
      search: initialQp.get('search') ?? '',
      pageSize: initialQp.get('pageSize') ? Number(initialQp.get('pageSize')) : 10,
    };
    this.form.patchValue(initialValues);

    // React to sub_category → fixed item selects and attributes
    this.form.get('sub_category_id')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(subId => {
        this.form.patchValue({ fixed_item_id: null }, { emitEvent: false });
        this.fixedItems = [];
        this.dynamicAttributes = [];

        // Reset dynamic attribute form controls
        this.dynamicAttributes.forEach((attr: any) => {
          if (this.form.get(attr.field_name)) {
            (this.form as any).removeControl(attr.field_name);
          }
        });

        if (subId) {
          // Load fixed items
          this.cats.getFixedItems(subId).subscribe(fi => (this.fixedItems = fi));

          // Load dynamic attributes for this category, filtered by sub-category
          this.assets.getCategoryAttributes(this.currentCategoryId!, subId).pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (attrs) => {
                this.dynamicAttributes = (attrs || []).filter((attr: any) => attr.field_name);
                // Add dynamic attribute controls to form
                this.dynamicAttributes.forEach((attr: any) => {
                  if (!this.form.get(attr.field_name)) {
                    this.form.addControl(attr.field_name, this.fb.control(null));
                  }
                });
                this.updateDisplayedColumns();
              },
              error: () => {
                this.dynamicAttributes = [];
                this.updateDisplayedColumns();
              }
            });
        } else {
          this.updateDisplayedColumns();
        }
      });

    // Initialize from URL
    const qp$ = this.route.queryParamMap.pipe(
      map(qp => ({
        category_id: qp.get('category_id') ? Number(qp.get('category_id')) : null,
        sub_category_id: qp.get('sub_category_id') ? Number(qp.get('sub_category_id')) : null,
        fixed_item_id: qp.get('fixed_item_id') ? Number(qp.get('fixed_item_id')) : null,
        status_id: qp.get('status_id') ? Number(qp.get('status_id')) : null,
        location_id: qp.get('location_id') ? Number(qp.get('location_id')) : null,
        floor_id: qp.get('floor_id') ? Number(qp.get('floor_id')) : null,
        supplier_id: qp.get('supplier_id') ? Number(qp.get('supplier_id')) : null,
        holder_user_id: qp.get('holder_user_id') ? Number(qp.get('holder_user_id')) : null,
        search: qp.get('search') ?? '',
        page: qp.get('page') ? Number(qp.get('page')) : 1,
        pageSize: qp.get('pageSize') ? Number(qp.get('pageSize')) : 10,
        sort: qp.get('sort') ?? 'created_at',
        dir: (qp.get('dir') as 'asc' | 'desc') ?? 'desc',
      })),
      tap(qp => {
        // When category changes from sidebar, reset filters and load related data
        if (qp.category_id !== this.currentCategoryId) {
          this.currentCategoryId = qp.category_id;
          this.currentCategoryName = qp.category_id ? 'Loading...' : '';
          // Clear current data immediately when category changes
          this.data = [];
          this.total = 0;
          // Reset all filters when switching categories
          this.form.patchValue({
            sub_category_id: null,
            fixed_item_id: null,
            status_id: null,
            location_id: null,
            floor_id: null,
            supplier_id: null,
            holder_user_id: null,
            search: '',
          }, { emitEvent: false });
          this.subs = [];
          this.fixedItems = [];
          this.dynamicAttributes = [];
          // Reset dynamic attributes
          this.dynamicAttributes.forEach((attr: any) => {
            if (this.form.get(attr.field_name)) {
              this.form.get(attr.field_name)?.setValue(null, { emitEvent: false });
            }
          });

          // Load category name
          if (qp.category_id) {
            this.cats.getCategory(qp.category_id).pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (category:any) => {
                  this.currentCategoryName = category.data.name;
                },
                error: () => {
                  this.currentCategoryName = 'Unknown Category';
                }
              });
          }

          // Load subcategories for the selected category
          if (qp.category_id) {
            this.isLoadingCategories = true;
            this.cats.getSubCategories(qp.category_id).pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (s) => {
                  this.subs = s;
                  this.isLoadingCategories = false;
                },
                error: () => {
                  this.isLoadingCategories = false;
                }
              });

            // Note: Attributes are loaded when sub-category is selected, not category
          }
        }

        // Update form values from query params (for non-category changes)
        this.form.patchValue({
          sub_category_id: qp.sub_category_id,
          fixed_item_id: qp.fixed_item_id,
          status_id: qp.status_id,
          location_id: qp.location_id,
          floor_id: qp.floor_id,
          supplier_id: qp.supplier_id,
          holder_user_id: qp.holder_user_id,
          search: qp.search,
          pageSize: qp.pageSize,
        }, { emitEvent: false });

        // Pre-load fixed items if sub_category is in URL
        if (qp.sub_category_id) {
          this.cats.getFixedItems(qp.sub_category_id).pipe(takeUntil(this.destroy$))
            .subscribe(f => (this.fixedItems = f));
        }
      }),
      shareReplay(1)
    );

    combineLatest([
      qp$,
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
      map(([qp, form]) => {
        const params: any = {
          ...form,
          category_id: qp.category_id,
          page: qp.page,
          sort: this.sortState.active,
          dir: (this.sortState.direction || 'desc') as 'asc'|'desc'
        };
        // Remove null/undefined values
        Object.keys(params).forEach((key: string) => {
          if (params[key] === null || params[key] === undefined || params[key] === '') {
            delete params[key];
          }
        });
        return params;
      }),
      switchMap(params => {
        this.isLoadingAssets = true;
        return this.assets.listAssets(params);
      })
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: PagedResult<AssetListItem>) => {
        this.data = res.data;
        this.total = res.total;
        this.isLoadingAssets = false;
      },
      error: () => {
        this.data = [];
        this.total = 0;
        this.isLoadingAssets = false;
      }
    });

    // Fetch filter options
    this.assets.getStatuses().pipe(takeUntil(this.destroy$)).subscribe(s => (this.statuses = s || []));
    this.assets.getLocations().pipe(takeUntil(this.destroy$)).subscribe(l => (this.locations = l || []));
    this.assets.getFloors().pipe(takeUntil(this.destroy$)).subscribe(f => (this.floors = f || []));
    this.assets.getSuppliers().pipe(takeUntil(this.destroy$)).subscribe(s => (this.suppliers = s || []));
    this.assets.getUsers().pipe(takeUntil(this.destroy$)).subscribe(u => (this.holders = u || []));
  }

  
  onPick(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.progress = 0;
    this.isUploading = true;
    this.message = '';

    this.importer.upload(file, this.withCredentials).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.message = event.body?.ok ? 'Import completed.' : 'Done, but server did not confirm success.';
        }
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload error:', err);
        this.message = err?.error?.message || 'Upload failed (check CORS/auth).';
      }
    });
  }

  onSearchEnter() {
    this.updateUrl({ page: 1 });
  }

  pageChange(e: PageEvent) {
    // Update the form's pageSize control to keep it in sync
    this.form.patchValue({ pageSize: e.pageSize });
    this.updateUrl({ page: e.pageIndex + 1, pageSize: e.pageSize });
  }

  sortChange(e: Sort) {
    this.sortState = e.direction ? e : { active: 'created_at', direction: 'desc' };
    this.updateUrl({ page: 1, sort: this.sortState.active, dir: this.sortState.direction || 'desc' });
  }

  updateUrl(partial: any) {
    const v = this.form.value;
    const currentCategoryId = this.route.snapshot.queryParamMap.get('category_id');
    
    const queryParams: any = {
      category_id: currentCategoryId || null,
      sub_category_id: v.sub_category_id || null,
      fixed_item_id: v.fixed_item_id || null,
      status_id: v.status_id || null,
      location_id: v.location_id || null,
      floor_id: v.floor_id || null,
      supplier_id: v.supplier_id || null,
      holder_user_id: v.holder_user_id || null,
      search: v.search || null,
      pageSize: v.pageSize || 10,
      ...partial,
    };

    // Add dynamic attribute filters
    this.dynamicAttributes.forEach((attr: any) => {
      const value = (v as any)[attr.field_name];
      if (value) {
        queryParams[attr.field_name] = value;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  import(){}

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
