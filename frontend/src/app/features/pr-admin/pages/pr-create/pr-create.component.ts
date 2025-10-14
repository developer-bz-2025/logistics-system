import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
// import { PrService } from '../../services/pr.service';
import { ReferenceService  } from '../../../../core/services/reference.service';
import { ChangeDetectorRef } from '@angular/core';
import { SelectOption } from 'src/app/core/models/reference';
import { of, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { PrService } from 'src/app/core/services/pr.service';
import { ToastService } from 'src/app/core/services/toast.service';



@Component({
  selector: 'app-pr-create',
  templateUrl: './pr-create.component.html',
  styleUrls: ['./pr-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrCreateComponent {

  categories: SelectOption[] = [];                 // loaded once
subOptions: SelectOption[][] = [];               // per-row subs
itemOptions: SelectOption[][] = [];              // per-row items
private rowSubs: Subscription[] = [];            // to clean up
suppliers:any[];

serverErrors: string[] = []; // collect backend validation


  form: FormGroup;



  isDragOver = false;
  uploadedFile: File | null = null;
  trackByIndex = (_: number, __: any) => _;
  submitting = false;


  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private ref: ReferenceService,  private prService: PrService,private router: Router,  private toast: ToastService
  ) {

    this.form = this.fb.group({
      prCode: [{ value: '', disabled: false }, [Validators.required, Validators.maxLength(30)]],
      prDate: [null, Validators.required],
      notes: [''],
      items: this.fb.array([this.createItemRow()]),
      document: [null,Validators.required], // keep as File | null; template handles preview
    });
  }

  // helper to flatten Laravel errors
private extractErrors(err: any): string[] {
  const out: string[] = [];
  const em = err?.error?.errors;
  if (em && typeof em === 'object') {
    Object.keys(em).forEach(k => {
      const arr = em[k];
      if (Array.isArray(arr)) arr.forEach((m: string) => out.push(`${k}: ${m}`));
    });
  } else if (err?.error?.message) {
    out.push(err.error.message);
  }
  return out.length ? out : ['Unexpected error occurred.'];
}

  
  ngOnDestroy() {
    this.rowSubs.forEach(s => s.unsubscribe());
  }
  
  // convenience
  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItemRow(): FormGroup {
    return this.fb.group({
      category: [null, Validators.required],      // number expected from API
      subCategory: [null, Validators.required],
      item: [null, Validators.required],
      supplier: [null, Validators.required],
      qty: [{ value: 1, disabled: true }],
      unit_cost: [null, [Validators.required, Validators.min(0)]],
      currency: [{ value: 'USD', disabled: true }],
      remark: ['']
    });
  }

  ngOnInit() {
    this.ref.getCategories().subscribe(list => {
      this.categories = this.ref.asOptions(list);   // list is now guaranteed T[]
      this.cdr.markForCheck();
    });
    this.setupRowStreams(0);
  }

  addItemRow() {
    this.items.push(this.createItemRow());
    const idx = this.items.length - 1;
    this.subOptions[idx] = [];
    this.itemOptions[idx] = [];
    this.setupRowStreams(idx);
    this.cdr.markForCheck();
  }
  
  removeItemRow(i: number) {
    if (this.items.length > 1) {
      this.items.removeAt(i);
      this.subOptions.splice(i, 1);
      this.itemOptions.splice(i, 1);
      const s = this.rowSubs.splice(i, 1)[0]; s?.unsubscribe();
      this.cdr.markForCheck();
    }
  }

  // set up cascading loaders for a given row index
private setupRowStreams(i: number) {
  const row = this.items.at(i) as FormGroup;
  const catCtrl = row.get('category')!;
  const subCtrl = row.get('subCategory')!;

  // When category changes → load subcategories, reset sub/item
  const sub1 = catCtrl.valueChanges.pipe(
    startWith(catCtrl.value),
    switchMap((catId: number | null) => {
      if (!catId) { this.subOptions[i] = []; this.itemOptions[i] = []; subCtrl.setValue(null); row.get('item')!.setValue(null); this.cdr.markForCheck(); return of([]); }
      return this.ref.getSubCategories(Number(catId));
    })
  ).subscribe(list => {
    this.subOptions[i] = this.ref.asOptions(list);
    // reset sub & item when options refresh
    subCtrl.setValue(null);
    row.get('item')!.setValue(null);
    this.itemOptions[i] = [];
    this.cdr.markForCheck();
  });

  // When subCategory changes → load fixed items, reset item
  const sub2 = subCtrl.valueChanges.pipe(
    startWith(subCtrl.value),
    switchMap((subId: number | null) => {
      if (!subId) { this.itemOptions[i] = []; row.get('item')!.setValue(null); this.cdr.markForCheck(); return of([]); }
      return this.ref.getFixedItems(Number(subId));
    })
  ).subscribe(list => {
    this.itemOptions[i] = this.ref.asOptions(list);
    row.get('item')!.setValue(null);
    this.cdr.markForCheck();
  });

  this.rowSubs[i] = new Subscription();
  this.rowSubs[i].add(sub1);
  this.rowSubs[i].add(sub2);
}

  // computed totals
  rowTotal(i: number): number {
    const row = this.items.at(i)?.value;
    const qty = 1;
    const price = Number(row?.unit_cost  || 0);
    return qty * price;
  }

  grandTotal(): number {
    return this.items.controls.reduce((sum, _, i) => sum + this.rowTotal(i), 0);
  }

  onCategoryChange(i: number) {
    // reset subCategory when category changes
    const row = this.items.at(i) as FormGroup;
    row.get('subCategory')?.setValue('');
  }

  // ----- file upload (click + drag & drop) -----
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setFile(file);
  }

  @HostListener('document:dragover', ['$event'])
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver = true;
  }
  @HostListener('document:dragleave', ['$event'])
  onDragLeave(_ev: DragEvent) {
    this.isDragOver = false;
  }
  @HostListener('document:drop', ['$event'])
  onDropDoc(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver = false;
    const file = ev.dataTransfer?.files?.[0] ?? null;
    // Only accept when dropping over the drop zone (optional area check skipped for simplicity)
    if (file) this.setFile(file);
  }

  setFile(file: File | null) {
    this.uploadedFile = file;
    const ctrl = this.form.get('document');
    ctrl?.setValue(file);
    ctrl?.markAsTouched();
    ctrl?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  // ----- submit -----
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.serverErrors = ['Please fix the highlighted fields before submitting.'];
      this.cdr.markForCheck();
      return;
    }
    const raw = this.form.getRawValue();
  
    const items = (raw.items as any[]).map(it => ({
      supplier_id: it.supplier,      // number or numeric string
      fixed_item_id: it.item,        // number or numeric string
      qty: 1,
      unit_cost: Number(it.unit_cost ?? 0),
      currency: 'USD',
    }));
  
    // Build FormData FLAT + bracketed items
    const fd = new FormData();
    fd.append('pr_code', raw.prCode);
    fd.append('pr_date', raw.prDate);       // YYYY-MM-DD
    // total_price optional (server recomputes); you can omit or include
    const total_price = items.reduce((s, r) => s + r.qty * r.unit_cost, 0);
    fd.append('total_price', String(total_price));
  
    // IMPORTANT: bracketed array fields — NOT JSON
    items.forEach((it, i) => {
      fd.append(`items[${i}][supplier_id]`, String(it.supplier_id));
      fd.append(`items[${i}][fixed_item_id]`, String(it.fixed_item_id));
      fd.append(`items[${i}][qty]`, String(it.qty));
      fd.append(`items[${i}][unit_cost]`, String(it.unit_cost));
      fd.append(`items[${i}][currency]`, it.currency);
    });
  
    // mandatory file
    fd.append('pr_file', raw.document);
  
    this.submitting = true;
    this.serverErrors = [];
    this.cdr.markForCheck();
  

    this.prService.create(fd).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.cdr.markForCheck();
        // Your backend returns: { message: 'PR created', data: {...} }
        const data = res?.data ?? res;
        // alert(`PR ${data?.pr_code ?? ''} created successfully.`);
        this.toast.success('Purchase Request created', `PR ${data?.pr_code ?? ''}`);
        this.router.navigate(['/pr/list']);
        // if (data?.id != null) this.router.navigate(['/pr', data.id]);
        // else this.router.navigate(['/pr']);
      },
      error: (err) => {
        this.submitting = false;

        this.serverErrors = this.extractErrors(err);
        this.cdr.markForCheck();
        console.error('[PR CREATE] failed', err);
        const first = this.serverErrors[0] ?? 'Failed to create PR.';
        this.toast.error(first, 'Create failed', 5000);
        console.error('[PR CREATE] failed', err);
        // const em = err?.error?.errors;
        // if (em) {
        //   const firstKey = Object.keys(em)[0];
        //   alert(`${err.error.message}\n\n${firstKey}: ${em[firstKey][0]}`);
        // } else {
        //   alert(err?.error?.message ?? 'Failed to create PR.');
        // }
      }
    });
  }
  
  
}
