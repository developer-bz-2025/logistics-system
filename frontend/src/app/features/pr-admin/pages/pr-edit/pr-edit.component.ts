import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChildren, QueryList } from '@angular/core';
import { AbstractControl, ValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { Observable, of, Subject, combineLatest } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Local service + models imports (see files below in this doc)
import { PrService } from '../../services/pr.service';
import { ReferenceService } from 'src/app/core/services/reference.service';
import { SupplierService } from 'src/app/core/services/supplier.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { DiffService } from '../../utils/diff.util';
import { Category, SubCategory, FixedItem, Supplier } from '../../../../core/models/reference';
import { PrRow as PRDto, PrItem as PRItemDto } from '../../models/pr';
import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CategoryService, AssetService } from 'src/app/core/services/category.service'; // <- add AssetService


function atLeastOneItem(): ValidatorFn {
  return (control: AbstractControl) => {
    const fa = control as FormArray;
    return fa.length > 0 ? null : { minItems: true };
  };
}

@Component({
  selector: 'app-pr-edit',
  templateUrl: './pr-edit.component.html',
  styleUrls: ['./pr-edit.component.scss']
})
export class PrEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private prService = inject(PrService);
  private refService = inject(ReferenceService);
  private supplierService = inject(SupplierService);
  private toast = inject(ToastService);
  private diff = inject(DiffService);
  private auth = inject(AuthService);
  private assetService = inject(AssetService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  pr$!: Observable<PRDto>;
  original!: PRDto;

  hasChanges = false;

  apiErrorMessage: string | null = null;                 // top banner message
  apiFieldErrors: Record<string, string[]> = {};

  availableLocations: Array<{ id: number; name: string }> = [];


  isLoading: boolean = true;
  isSubmitting = false;

  categories: Category[] = [];

  // For each item-row we keep its subcategories + fixed items options
  rowOptions: Array<{ subCategories: SubCategory[]; items: FixedItem[]; supplierResults: Supplier[]; supplierLoading: boolean }> = [];

  form: FormGroup = this.fb.group({
    pr_date: ['', [Validators.required]],
    pr_code: ['', [Validators.required, Validators.maxLength(190)]],
    reason: ['', [Validators.required, Validators.minLength(10)]],
    pr_file: [null],
    location_id: [null],
    items: this.fb.array([], [atLeastOneItem()])   // ⬅️ replace Validators.minLength(1)
  });


  // totals
  newTotal = 0;
  totalDelta = 0;

  private calcNewTotal(): number {
    // qty is effectively 1 (you append qty=1 on submit). If you add qty later, multiply here.
    return this.itemsFA.controls.reduce((sum, ctrl) => {
      const raw = ctrl.get('unit_cost')?.value;
      const n = Number(raw);
      return sum + (isFinite(n) ? n : 0);
    }, 0);
  }



  private patchDefaultLocationFromPr() {
    // original may contain location fields depending on backend
    const locId = (this.original as any)?.location_id ?? (this.original as any)?.location?.id ?? null;
    if (locId) this.form.get('location_id')!.setValue(locId);
    else if (this.availableLocations.length === 1) {
      // auto-fill when only one location
      this.form.get('location_id')!.setValue(this.availableLocations[0].id);
    }
  }

  private setupTotalWatcher() {
    // Recalculate on any form change (items add/remove or unit_cost edits)
    this.form.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.newTotal = this.calcNewTotal();
      const current = Number(this.original?.total_price ?? 0);
      this.totalDelta = this.newTotal - current;
      this.cdr.markForCheck();
    });

    // Also kick it once now
    this.newTotal = this.calcNewTotal();
    this.totalDelta = this.newTotal - Number(this.original?.total_price ?? 0);
  }


  private clearServerErrors(ctrl: AbstractControl = this.form): void {
    const asAny = ctrl as any;
    if (asAny.controls) {
      const controls = asAny.controls;
      if (Array.isArray(controls)) {
        controls.forEach(c => this.clearServerErrors(c));
      } else {
        Object.keys(controls).forEach(k => this.clearServerErrors(controls[k]));
      }
    }
    const errs = ctrl.errors || {};
    if ('server' in errs) {
      delete errs['server'];
      ctrl.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  // Set one control's "server" error
  private setServerErrorOn(path: string, messages: string[]) {
    const ctrl = this.resolvePath(path);
    if (!ctrl) return;
    const prev = ctrl.errors || {};
    ctrl.setErrors({ ...prev, server: messages });
    ctrl.markAsTouched();
  }

  // Resolve Laravel-like dotted paths to a control
  // e.g. "pr_code", "pr_date", "items.0.unit_cost"
  private resolvePath(path: string): AbstractControl | null {
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let ctrl: AbstractControl | null = this.form;
    for (const p of parts) {
      if (!ctrl) return null;
      if (ctrl instanceof FormGroup) {
        ctrl = ctrl.get(p);
      } else if (ctrl instanceof FormArray) {
        const idx = Number(p);
        ctrl = isFinite(idx) ? ctrl.at(idx) : null;
      } else {
        return null;
      }
    }
    return ctrl;
  }

  // Centralized handler for HttpErrorResponse
  private handleHttpError(err: HttpErrorResponse) {
    // Reset previous
    this.apiErrorMessage = null;
    this.apiFieldErrors = {};
    this.clearServerErrors();

    // Prefer backend human message if present
    const backendMsg = (err.error && (err.error.message || err.error.error)) || err.message;

    // 409 Conflict → show blocking banner with backend message
    if (err.status === 409) {
      this.apiErrorMessage = backendMsg || 'Conflict. Please try again later.';
    }

    // 422 Unprocessable Entity → map field errors to controls
    const errors = err.error?.errors as Record<string, string[]> | undefined;
    if (errors && typeof errors === 'object') {
      this.apiFieldErrors = errors;

      // Map each error key to a control; support items.X.Y
      Object.entries(errors).forEach(([key, msgs]) => {
        // Normalize keys like "items[0].unit_cost" → "items.0.unit_cost"
        const norm = key.replace(/\[(\d+)\]/g, '.$1');
        this.setServerErrorOn(norm, msgs);
      });

      // Also show a concise banner if no 409 already set
      if (!this.apiErrorMessage) {
        this.apiErrorMessage = backendMsg || 'Please review the highlighted fields.';
      }
    }

    // Fallback for other HTTP codes
    if (!this.apiErrorMessage) {
      this.apiErrorMessage = backendMsg || 'Unexpected error. Please try again.';
    }

    this.cdr.markForCheck();
  }


  get itemsFA() { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    // this.pr$ = this.route.data.pipe(map(d => d['pr'] as PRDto));
    // load categories in parallel
    this.refService.getCategories().subscribe(cats => { this.categories = cats; this.cdr.markForCheck(); });

    this.route.paramMap.pipe(
      map(pm => pm.get('id')),
      filter(Boolean),
      switchMap(id => this.prService.getById(+id!)),
      tap(pr => console.log('pr details', pr))
    ).subscribe(pr => {
      this.original = pr;
      console.log("pr details is", this.original)

      this.form.patchValue({
        pr_date: pr.pr_date,
        pr_code: pr.pr_code,
        reason: ''
      });
      (pr.items ?? []).forEach((it, idx) => this.addItemRowFromExisting(it, idx));
      this.setupSummaryWatcher();
      this.isLoading = false;
      this.cdr.markForCheck();
      this.setupTotalWatcher();

    });

    this.auth.ensureUserLoaded().subscribe(() => {
      const u = this.auth.user();
      const isSuper = this.auth.hasAnyRole(['super_admin']);
      if (isSuper) {
        // fetch all locations (AssetService exposes getLocations())
        this.assetService.getLocations().subscribe((list: any[]) => {
          this.availableLocations = list.map((l: any) => ({ id: l.id, name: l.name }));
          this.patchDefaultLocationFromPr();
          this.cdr.markForCheck();
        });
      } else if (u?.id) {
        // fetch full user (will include assigned locations)
        this.userService.getUser(u.id).subscribe((userFull: any) => {
          this.availableLocations = (userFull?.locations || []).map((l: any) => ({ id: l.id, name: l.name }));
          this.patchDefaultLocationFromPr();
          this.cdr.markForCheck();
        });
      }
    });


  }




  row(i: number) { return this.itemsFA.at(i) as FormGroup; }

  // Existing rows are those that came from the original PR payload (usually have an id)
  isExisting(i: number): boolean {
    // return !!this.original?.items?.[i]?.id;
    return !!(this.itemsFA.at(i) as FormGroup).get('pr_item_id')?.value;

  }

  getCategoryName(id?: number) {
    return this.categories.find(c => c.id === id)?.name || ('#' + id);
  }
  getSubCategoryName(id?: number) {
    const pool = this.rowOptions.flatMap(r => r.subCategories);
    return pool.find(s => s.id === id)?.name || ('#' + id);
  }
  getItemName(id?: number) {
    const pool = this.rowOptions.flatMap(r => r.items);
    return pool.find(it => it.id === id)?.name || ('#' + id);
  }

  getOrigItem(i: number) {
    return this.original?.items ? this.original.items[i] : undefined;
  }

  // ---------------------------------------------
  // Item row helpers
  // ---------------------------------------------
  private createItemGroup(): FormGroup {
    return this.fb.group({
      pr_item_id: [null],
      category_id: [null, Validators.required],
      sub_category_id: [null, Validators.required],
      fixed_item_id: [null, Validators.required],
      supplier_id: [null, Validators.required],
      supplier_query: [''], // for typeahead input only
      unit_cost: [null, [Validators.required, Validators.min(0.01)]],
      currency: ['USD']
    });
  }

  addItemRow(): void {
    const idx = this.itemsFA.length;
    this.itemsFA.push(this.createItemGroup());
    this.rowOptions.push({ subCategories: [], items: [], supplierResults: [], supplierLoading: false });
    this.setupCascadesForRow(idx);
    this.setupSupplierTypeaheadForRow(idx);
    this.cdr.markForCheck();
    this.form.updateValueAndValidity({ emitEvent: true });


  }

  private addItemRowFromExisting(item: PRItemDto, idx: number): void {
    const fg = this.createItemGroup();
    this.itemsFA.push(fg);
    this.rowOptions.push({ subCategories: [], items: [], supplierResults: [], supplierLoading: false });

    // Load options first, then patch values to avoid empty dropdowns
    const categoryId = item.category_id ?? null;
    const subCategoryId = item.sub_category_id ?? null;

    // Load subcategories first if category exists
    const loadSubCats$ = categoryId
      ? this.loadSubCategories(idx, categoryId)
      : of([]);

    loadSubCats$.pipe(
      switchMap(() => {
        // Then load fixed items if subcategory exists
        return subCategoryId
          ? this.loadFixedItems(idx, subCategoryId)
          : of([]);
      })
    ).subscribe({
      next: () => {
        // Now patch values after options are loaded
        fg.patchValue({
          pr_item_id: item.pr_item_id,
          category_id: categoryId,
          sub_category_id: subCategoryId,
          fixed_item_id: item.fixed_item_id,
          supplier_id: item.supplier_id,
          supplier_query: item.supplier_name ?? '',   // <= prefill
          unit_cost: item.unit_cost,
          currency: item.currency ?? 'USD'
        }, { emitEvent: false }); // Don't trigger cascades yet

        // Setup cascades and typeahead after values are set
        this.setupCascadesForRow(idx);
        this.setupSupplierTypeaheadForRow(idx);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(`Error loading options for item ${idx}:`, err);
        // Still patch values even if options fail to load (user can manually select)
        fg.patchValue({
          pr_item_id: item.pr_item_id,
          category_id: categoryId,
          sub_category_id: subCategoryId,
          fixed_item_id: item.fixed_item_id,
          supplier_id: item.supplier_id,
          supplier_query: item.supplier_name ?? '',
          unit_cost: item.unit_cost,
          currency: item.currency ?? 'USD'
        }, { emitEvent: false });
        this.setupCascadesForRow(idx);
        this.setupSupplierTypeaheadForRow(idx);
        this.cdr.markForCheck();
      }
    });
  }

  clearSupplier(i: number) {
    const row = this.itemsFA.at(i) as FormGroup;
    row.patchValue({ supplier_id: null, supplier_query: '' });
    this.rowOptions[i].supplierResults = [];
    this.cdr.markForCheck();
  }

  chooseSupplier(i: number, sup: Supplier) {
    const row = this.itemsFA.at(i) as FormGroup;
    row.patchValue({ supplier_id: sup.id, supplier_query: sup.name });
    this.rowOptions[i].supplierResults = [];
    this.cdr.markForCheck();
  }

  removeRow(i: number): void {
    const ok = window.confirm('Remove this row?');
    if (!ok) return;
    this.itemsFA.removeAt(i);
    this.rowOptions.splice(i, 1);
    this.cdr.markForCheck();
    this.form.updateValueAndValidity({ emitEvent: true });

  }

  fileBaseName(path?: string | null): string {
    if (!path) return '—';
    try {
      const clean = path.split('?')[0].split('#')[0];
      return clean.split('/').pop() || path;
    } catch { return path; }
  }

  // ---------------------------------------------
  // Cascading logic per row
  // ---------------------------------------------
  private setupCascadesForRow(i: number): void {
    const row = this.itemsFA.at(i) as FormGroup;
    row.get('category_id')!.valueChanges.pipe(distinctUntilChanged()).subscribe((catId: number) => {
      row.patchValue({ sub_category_id: null, fixed_item_id: null }, { emitEvent: false });
      this.rowOptions[i].items = [];
      this.loadSubCategories(i, catId).subscribe(() => this.cdr.markForCheck());
    });

    row.get('sub_category_id')!.valueChanges.pipe(distinctUntilChanged()).subscribe((subId: number) => {
      row.patchValue({ fixed_item_id: null }, { emitEvent: false });
      this.loadFixedItems(i, subId).subscribe(() => this.cdr.markForCheck());
    });
  }

  private loadSubCategories(i: number, categoryId: number | null): Observable<SubCategory[]> {
    if (!categoryId) { this.rowOptions[i].subCategories = []; return of([]); }
    return this.refService.getSubCategories(categoryId).pipe(tap(list => this.rowOptions[i].subCategories = list));
  }

  private loadFixedItems(i: number, subCategoryId: number | null): Observable<FixedItem[]> {
    if (!subCategoryId) { this.rowOptions[i].items = []; return of([]); }
    return this.refService.getFixedItems(subCategoryId).pipe(tap(list => this.rowOptions[i].items = list));
  }

  // ---------------------------------------------
  // Supplier typeahead per row
  // ---------------------------------------------
  private setupSupplierTypeaheadForRow(i: number): void {
    const row = this.itemsFA.at(i) as FormGroup;
    const qCtrl = row.get('supplier_query') as FormControl<string>;

    qCtrl.valueChanges.pipe(
      startWith(qCtrl.value ?? ''),      // will fetch when user starts typing
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(q => {
        const term = (q || '').trim();
        if (!term) {
          this.rowOptions[i].supplierResults = [];
          return of([]);
        }
        this.rowOptions[i].supplierLoading = true;
        this.cdr.markForCheck();

        // ⬇️ Removed category_id from options
        return this.supplierService.search(term, { per_page: 8 }).pipe(
          tap(() => {
            this.rowOptions[i].supplierLoading = false;
            this.cdr.markForCheck();
          })
        );
      })
    )
      .subscribe(list => {
        this.rowOptions[i].supplierResults = list;
        this.cdr.markForCheck();
      });
  }


  // chooseSupplier(i: number, sup: Supplier) {
  //   const row = this.itemsFA.at(i) as FormGroup;
  //   row.patchValue({ supplier_id: sup.id, supplier_query: sup.name });
  //   this.rowOptions[i].supplierResults = [];
  //   this.cdr.markForCheck();
  // }

  // ---------------------------------------------
  // File selection
  // ---------------------------------------------
  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.form.patchValue({ pr_file: file });
  }

  // ---------------------------------------------
  // Summary
  // ---------------------------------------------
  summaryLines: string[] = [];

  private setupSummaryWatcher() {
    combineLatest([
      this.form.valueChanges.pipe(startWith(this.form.value)),
      of(this.original)
    ])
      .pipe(debounceTime(150))
      .subscribe(([val, orig]) => {
        // decorate items with names (same as you already do)
        const itemsWithNames = this.itemsFA.controls.map((ctrl, idx) => {
          const it = ctrl.value;
          return {
            ...it,
            fixed_item_name: this.getItemName(it.fixed_item_id),
            supplier_name: ctrl.get('supplier_query')?.value ||
              this.original?.items?.[idx]?.supplier_name || ''
          };
        });

        const decorated = { ...val, items: itemsWithNames };

        // // build summary lines (strings)
        // const lines = this.diff.buildSummary(this.original, decorated);
        // this.summaryLines = lines;

        // ensure decorated has friendly location name for DiffService
        const selectedLocId = decorated.location_id ?? null;
        if (selectedLocId && !decorated.location_name) {
          const found = this.availableLocations.find(l => Number(l.id) === Number(selectedLocId));
          if (found) decorated.location_name = found.name;
        }
        // also fall back to original location name if current has none
        if (!decorated.location_name) {
          decorated.location_name = (this.original as any)?.location?.name ?? null;
        }

        const lines = this.diff.buildSummary(this.original, decorated);
        this.summaryLines = lines;

        // consider any uploaded file a change too
        const fileChanged = !!val.pr_file;

        // if DiffService returns "No changes detected yet."
        const noChangesMsg = lines.length === 1 && /No changes detected yet\./i.test(lines[0]);

        this.hasChanges = !noChangesMsg || fileChanged;

        this.cdr.markForCheck();
      });
  }


  // ---------------------------------------------
  // Submit
  // ---------------------------------------------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix validation errors.');
      return;
    }

    this.apiErrorMessage = null;
    this.apiFieldErrors = {};
    this.clearServerErrors();

    const fd = new FormData();
    const v = this.form.value;
    const formattedDate = v.pr_date ? String(v.pr_date).slice(0, 10) : '';
    fd.append('pr_code', v.pr_code);
    fd.append('pr_date', formattedDate);
    // fd.append('pr_date', v.pr_date);
    fd.append('reason', v.reason);
    if (v.location_id) fd.append('location_id', String(v.location_id));

    (v.items as any[]).forEach((it, idx) => {
      console.log(`fixed item is:`, it.fixed_item_id);


      fd.append(`items[${idx}][pr_item_id]`, it.pr_item_id != null ? String(it.pr_item_id) : '');

      fd.append(`items[${idx}][supplier_id]`, String(it.supplier_id));
      fd.append(`items[${idx}][fixed_item_id]`, String(it.fixed_item_id));
      fd.append(`items[${idx}][qty]`, '1');
      fd.append(`items[${idx}][unit_cost]`, String(it.unit_cost));
      fd.append(`items[${idx}][currency]`, 'USD');
    });

    if (v.pr_file) fd.append('pr_file', v.pr_file);

    console.log("fd", fd)

    this.isSubmitting = true;
    const id = this.original.id;
    this.prService.update(id, fd).subscribe({
      next: (updated) => {
        this.isSubmitting = false;
        this.toast.success('PR updated successfully.');
        this.router.navigate(['/pr/list']);
      },
      error: (err: HttpErrorResponse) => {
        console.log("Err", err)
        this.handleHttpError(err);
        this.isSubmitting = false;
        this.toast.error('Failed to update PR.');
        this.cdr.markForCheck();
      }
    });
  }

  cancel() { this.router.navigate(['/prs']); }
}
