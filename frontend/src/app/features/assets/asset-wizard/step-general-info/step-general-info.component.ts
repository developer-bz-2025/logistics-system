import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, map, startWith } from 'rxjs/operators';
import { PrListItem } from '../../../../core/services/pr.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ReferenceService } from '../../../../core/services/reference.service';

@Component({
  selector: 'app-step-general-info',
  templateUrl: './step-general-info.component.html',
  styleUrls: ['./step-general-info.component.scss']
})
export class StepGeneralInfoComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() suppliers: any[] = [];
  @Input() brands: any[] = [];
  @Input() colors: any[] = [];
  @Input() prs: PrListItem[] = [];

  private destroy$ = new Subject<void>();

  // Filtered options for autocomplete
  filteredSuppliers$: Observable<any[]> = of([]);
  filteredBrands$: Observable<any[]> = of([]);

  constructor(
    private supplierService: SupplierService,
    private referenceService: ReferenceService
  ) {}

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutocomplete(): void {
    // Supplier autocomplete
    const supplierControl = this.form.get('supplier_id');
    if (supplierControl) {
      this.filteredSuppliers$ = supplierControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          // If value is an object (selected), don't search
          if (typeof value === 'object' && value !== null) {
            return of([]);
          }
          const searchValue = typeof value === 'string' ? value : '';
          return this.supplierService.search(searchValue, {});
        }),
        takeUntil(this.destroy$)
      );
    }

    // Brand autocomplete - since reference service doesn't have search, filter client-side
    const brandControl = this.form.get('brand_id');
    if (brandControl) {
      this.filteredBrands$ = brandControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        map(value => {
          // If value is an object (selected), don't filter
          if (typeof value === 'object' && value !== null) {
            return [];
          }
          const searchValue = typeof value === 'string' ? value.toLowerCase() : '';
          return this.brands.filter(brand =>
            brand.name.toLowerCase().includes(searchValue)
          );
        }),
        takeUntil(this.destroy$)
      );
    }
  }

  // Display functions for autocomplete
  displaySupplier(supplier: any): string {
    return supplier && supplier.name ? supplier.name : '';
  }

  displayBrand(brand: any): string {
    return brand && brand.name ? brand.name : '';
  }
}
