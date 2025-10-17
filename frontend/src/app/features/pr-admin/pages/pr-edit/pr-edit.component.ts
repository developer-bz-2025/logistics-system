import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChildren, QueryList } from '@angular/core';
import { AbstractControl, ValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { Observable, of, Subject, combineLatest } from 'rxjs';

// Local service + models imports (see files below in this doc)
import { PrService } from '../../services/pr.service';
import { ReferenceService } from 'src/app/core/services/reference.service';
import { SupplierService } from 'src/app/core/services/supplier.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { DiffService } from '../../utils/diff.util';
import { Category, SubCategory, FixedItem, Supplier } from '../../../../core/models/reference';
import { PrRow as PRDto, PrItem as PRItemDto } from '../../models/pr';


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

  pr$!: Observable<PRDto>;
  original!: PRDto;

  hasChanges = false;


  isLoading :boolean= true;
  isSubmitting = false;

  categories: Category[] = [];

  // For each item-row we keep its subcategories + fixed items options
  rowOptions: Array<{ subCategories: SubCategory[]; items: FixedItem[]; supplierResults: Supplier[]; supplierLoading: boolean }>=[];

  form: FormGroup = this.fb.group({
    pr_date: ['', [Validators.required]],
    pr_code: ['', [Validators.required, Validators.maxLength(190)]],
    reason: [''],
    pr_file: [null],
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
      console.log("pr details is",this.original)

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
    

  }


  

  row(i: number) { return this.itemsFA.at(i) as FormGroup; }

  // Existing rows are those that came from the original PR payload (usually have an id)
isExisting(i: number): boolean {
  return !!this.original?.items?.[i]?.id;
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
    fg.patchValue({
      category_id: item.category_id ?? null,
      sub_category_id: item.sub_category_id ?? null,
      fixed_item_id: item.fixed_item_id,
      supplier_id: item.supplier_id,
      supplier_query: item.supplier_name ?? '',   // <= prefill
      unit_cost: item.unit_cost,
      currency: item.currency ?? 'USD'
    });
    this.itemsFA.push(fg);
    this.rowOptions.push({ subCategories: [], items: [], supplierResults: [], supplierLoading: false });
  
    this.loadSubCategories(idx, fg.get('category_id')!.value).subscribe(() => {
      this.loadFixedItems(idx, fg.get('sub_category_id')!.value).subscribe(() => {
        this.setupCascadesForRow(idx);
        this.setupSupplierTypeaheadForRow(idx);
        this.cdr.markForCheck();
      });
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
      startWith(qCtrl.value ?? ''),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || String(q).trim().length < 1) { this.rowOptions[i].supplierResults = []; return of([]); }
        this.rowOptions[i].supplierLoading = true; this.cdr.markForCheck();
        return this.supplierService.search(q!, { per_page: 8, category_id: row.get('category_id')!.value }).pipe(tap(() => {
          this.rowOptions[i].supplierLoading = false; this.cdr.markForCheck();
        }));
      })
    ).subscribe(list => { this.rowOptions[i].supplierResults = list; this.cdr.markForCheck(); });
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
  
      // build summary lines (strings)
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

    const fd = new FormData();
    const v = this.form.value;
    fd.append('pr_code', v.pr_code);
    fd.append('pr_date', v.pr_date);
    fd.append('reason', v.reason);

    (v.items as any[]).forEach((it, idx) => {
      fd.append(`items[${idx}][supplier_id]`, String(it.supplier_id));
      fd.append(`items[${idx}][fixed_item_id]`, String(it.fixed_item_id));
      fd.append(`items[${idx}][qty]`, '1');
      fd.append(`items[${idx}][unit_cost]`, String(it.unit_cost));
      fd.append(`items[${idx}][currency]`, 'USD');
    });

    if (v.pr_file) fd.append('pr_file', v.pr_file);

    this.isSubmitting=true;
    const id = this.original.id;
    this.prService.update(id, fd).subscribe({
      next: (updated) => {
        this.isSubmitting=false;
        this.toast.success('PR updated successfully.');
        this.router.navigate(['/prs', updated.id]);
      },
      error: (err) => {
        this.isSubmitting=false;
        this.toast.error('Failed to update PR.');
        this.cdr.markForCheck();
      }
    });
  }

  cancel() { this.router.navigate(['/prs']); }
}
