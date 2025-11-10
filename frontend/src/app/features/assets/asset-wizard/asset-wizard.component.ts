import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin, combineLatest } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';
import { CategoryService, AssetService } from '../../../core/services/category.service';
import { ReferenceService } from '../../../core/services/reference.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { UserService } from '../../../core/services/user.service';
import { PrService, PrListItem } from '../../../core/services/pr.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, SubCategory, FixedItem, DynamicAttribute, SelectOption } from '../../../core/models/reference';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-asset-wizard',
  templateUrl: './asset-wizard.component.html',
  styleUrls: ['./asset-wizard.component.scss']
})
export class AssetWizardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form: FormGroup;
  currentStep = 0;
  isLinear = true;

  // Data
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  fixedItems: FixedItem[] = [];
  attributes: DynamicAttribute[] = [];
  suppliers: any[] = [];
  brands: any[] = [];
  colors: any[] = [];
  locations: any[] = [];
  floors: any[] = [];
  statuses: any[] = [];
  users: any[] = [];
  prs: PrListItem[] = [];

  // Loading states
  loading = {
    categories: false,
    subCategories: false,
    fixedItems: false,
    attributes: false,
    suppliers: false,
    brands: false,
    colors: false,
    locations: false,
    floors: false,
    statuses: false,
    users: false,
    submit: false
  };

  // Label maps for review
  labelMaps = {
    categories: new Map<number, string>(),
    subCategories: new Map<number, string>(),
    fixedItems: new Map<number, string>(),
    suppliers: new Map<number, string>(),
    brands: new Map<number, string>(),
    colors: new Map<number, string>(),
    locations: new Map<number, string>(),
    floors: new Map<number, string>(),
    statuses: new Map<number, string>(),
    users: new Map<number, string>(),
    attributes: new Map<string, Map<number, string>>()
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private categoryService: CategoryService,
    private assetService: AssetService,
    private referenceService: ReferenceService,
    private supplierService: SupplierService,
    private userService: UserService,
    private prService: PrService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      classification: this.fb.group({
        category_id: [null, Validators.required],
        sub_category_id: [null, Validators.required],
        fixed_item_id: [null, Validators.required],
        attributes: this.fb.array([])
      }),
      general: this.fb.group({
        supplier_id: [null],
        brand_id: [null],
        color_id: [null],
        pr_id: [null],
        acquisition_cost: [0, [Validators.required, Validators.min(0)]],
        acquisition_date: [null],
        warranty_start_date: [null],
        warranty_end_date: [null]
      }, { validators: this.dateRangeValidator }),
      assignment: this.fb.group({
        location_id: [null],
        floor_id: [null],
        holder_user_id: [null],
        status_id: [null]
      }),
      extra: this.fb.group({
        description: [''],
        notes: [''],
        budget_code: [''],
        budget_donor: ['']
      })
    });
  }

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('warranty_start_date')?.value;
    const end = group.get('warranty_end_date')?.value;
    if (start && end && start > end) {
      return { dateRange: true };
    }
    return null;
  }

  private loadInitialData(): void {
    this.loading.categories = this.loading.colors = this.loading.locations = this.loading.floors = this.loading.statuses = true;

    forkJoin({
      categories: this.referenceService.getCategories(),
      colors: this.referenceService.getColors(),
      locations: this.assetService.getLocations(),
      floors: this.assetService.getFloors(),
      statuses: this.assetService.getStatuses(),
      prs: this.prService.getPrs()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categories, colors, locations, floors, statuses, prs }) => {
          this.categories = categories;
          this.colors = colors;
          this.locations = locations;
          this.floors = floors;
          this.statuses = statuses;
          this.prs = prs;

          // Build label maps
          this.buildLabelMaps('categories', categories);
          this.buildLabelMaps('colors', colors);
          this.buildLabelMaps('locations', locations);
          this.buildLabelMaps('floors', floors);
          this.buildLabelMaps('statuses', statuses);
          this.buildLabelMaps('prs', prs.map(pr => ({ id: pr.id, name: pr.pr_code })));

          this.loading.categories = this.loading.colors = this.loading.locations = this.loading.floors = this.loading.statuses = false;
        },
        error: (error) => {
          console.error('Error loading initial data:', error);
          this.toastService.error('Failed to load initial data');
          this.loading.categories = this.loading.colors = this.loading.locations = this.loading.floors = this.loading.statuses = false;
        }
      });
  }

  private setupFormSubscriptions(): void {
    // Category change
    this.form.get('classification.category_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(categoryId => {
        if (categoryId) {
          this.onCategoryChange(categoryId);
        }
      });

    // Sub-category change
    this.form.get('classification.sub_category_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(subCategoryId => {
        if (subCategoryId) {
          this.onSubCategoryChange(subCategoryId);
        }
      });
  }

  private onCategoryChange(categoryId: number): void {
    // Check if classification fields are filled
    const classification = this.form.get('classification');
    const hasData = classification?.get('sub_category_id')?.value ||
                    classification?.get('fixed_item_id')?.value ||
                    (classification?.get('attributes') as FormArray)?.length > 0;

    // if (hasData) {
    //   // Show confirm dialog
    //   const confirmed = confirm('Changing category will clear sub-category, item, and attributes. Continue?');
    //   if (!confirmed) {
    //     // Reset category back
    //     classification?.get('category_id')?.setValue(null);
    //     return;
    //   }
    // }

    // Reset dependent fields
    this.resetClassificationFields();

    // Load sub-categories, suppliers, brands, attributes
    this.loading.subCategories = this.loading.suppliers = this.loading.brands = this.loading.attributes = true;

    forkJoin({
      subCategories: this.categoryService.getSubCategories(categoryId),
      suppliers: this.supplierService.search('', {}), // Fetch all suppliers without category filter
      brands: this.referenceService.getBrands(categoryId),
      attributes: this.assetService.getCategoryAttributes(categoryId) // Load attributes for category
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ subCategories, suppliers, brands, attributes }) => {
          this.subCategories = subCategories;
          this.suppliers = suppliers;
          this.brands = brands;
          this.attributes = attributes;

          // Build label maps
          this.buildLabelMaps('subCategories', subCategories);
          this.buildLabelMaps('suppliers', suppliers);
          this.buildLabelMaps('brands', brands);

          this.loading.subCategories = this.loading.suppliers = this.loading.brands = this.loading.attributes = false;

          // Setup attributes form array
          this.setupAttributesFormArray();
        },
        error: (error) => {
          console.error('Error loading category data:', error);
          this.toastService.error('Failed to load category data');
          this.loading.subCategories = this.loading.suppliers = this.loading.brands = this.loading.attributes = false;
        }
      });
  }

  private onSubCategoryChange(subCategoryId: number): void {
    const categoryId = this.form.get('classification.category_id')?.value;

    this.loading.fixedItems = this.loading.attributes = true;

    forkJoin({
      fixedItems: this.categoryService.getFixedItems(subCategoryId),
      attributes: categoryId ? this.assetService.getCategoryAttributes(categoryId, subCategoryId) : [] // Reload attributes with sub-category filter
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ fixedItems, attributes }) => {
          this.fixedItems = fixedItems;
          if (attributes) {
            this.attributes = attributes;
          }

          this.buildLabelMaps('fixedItems', fixedItems);

          this.loading.fixedItems = this.loading.attributes = false;

          // Reset fixed item and setup attributes form array
          this.form.get('classification.fixed_item_id')?.setValue(null);
          this.setupAttributesFormArray();
        },
        error: (error) => {
          console.error('Error loading sub-category data:', error);
          this.toastService.error('Failed to load sub-category data');
          this.loading.fixedItems = this.loading.attributes = false;
        }
      });
  }

  private resetClassificationFields(): void {
    const classification = this.form.get('classification');
    classification?.get('sub_category_id')?.setValue(null);
    classification?.get('fixed_item_id')?.setValue(null);
    (classification?.get('attributes') as FormArray)?.clear();

    this.subCategories = [];
    this.fixedItems = [];
    this.attributes = [];
  }

  private setupAttributesFormArray(): void {
    const attributesArray = this.form.get('classification.attributes') as FormArray;
    attributesArray.clear();

    this.attributes.forEach(attr => {
      attributesArray.push(this.fb.group({
        att_id: [attr.field_name],
        att_option_id: [null, attr.type === 'select' ? Validators.required : null]
      }));
    });
  }

  private buildLabelMaps(type: string, items: any[]): void {
    const map = this.labelMaps[type as keyof typeof this.labelMaps] as Map<number, string>;
    if (map) {
      items.forEach(item => map.set(item.id, item.name || item.label));
    }
  }

  // Step navigation
  canProceedToNext(): boolean {
    const currentStepControl = this.getCurrentStepControl();
    return currentStepControl ? currentStepControl.valid : false;
  }

  private getCurrentStepControl(): FormGroup | null {
    switch (this.currentStep) {
      case 0: return this.form.get('classification') as FormGroup;
      case 1: return this.form.get('general') as FormGroup;
      case 2: return this.form.get('assignment') as FormGroup;
      case 3: return this.form.get('extra') as FormGroup;
      default: return null;
    }
  }

  nextStep(): void {
    if (this.canProceedToNext()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Submit
  onSubmit(): void {
    if (this.form.valid) {
      this.loading.submit = true;

      const payload = {
        ...this.form.value.general,
        ...this.form.value.assignment,
        ...this.form.value.extra,
        fixed_item_id: this.form.value.classification.fixed_item_id,
        attributes: this.form.value.classification.attributes
      };

      this.assetService.createAsset(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.toastService.success(`Asset created • ${response.sn || 'AST-' + response.id}`);
            this.router.navigate(['/assets']);
          },
          error: (error) => {
            console.error('Error creating asset:', error);
            this.toastService.error('Failed to create asset');
            this.loading.submit = false;
          }
        });
    }
  }

  // Typeahead for users
  searchUsers = (search: string) => {
    return this.userService.search(search).pipe(
      map(users => users.map(u => ({ id: u.id, label: u.name })))
    );
  };
}
