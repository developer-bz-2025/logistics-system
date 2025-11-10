import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { AssetService, CategoryService } from 'src/app/core/services/category.service';
import { PrService } from 'src/app/core/services/pr.service';
import { Category, SubCategory, FixedItem } from 'src/app/core/models/reference';

@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.component.html',
  styleUrls: ['./asset-detail.component.scss']
})
export class AssetDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  assetId: number;
  asset: any = null;
  isLoading = false;
  isEditing = false;
  isSaving = false;
  prCode: string = '';

  // Form
  assetForm: FormGroup;

  // Dropdown data
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  fixedItems: FixedItem[] = [];
  statuses: any[] = [];
  locations: any[] = [];
  floors: any[] = [];
  suppliers: any[] = [];
  users: any[] = [];
  brands: any[] = [];
  colors: any[] = [];
  dynamicAttributes: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private assets: AssetService,
    private cats: CategoryService,
    private prService: PrService
  ) {
    this.assetId = Number(this.route.snapshot.paramMap.get('id'));
    this.assetForm = this.createForm();
  }

  ngOnInit() {
    this.loadAsset();
    this.loadDropdownData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      sn: [''],
      fixed_item_id: [null, Validators.required],
      description: [''],
      status_id: [null],
      location_id: [null],
      floor_id: [null],
      supplier_id: [null],
      brand_id: [null],
      color_id: [null],
      holder_user_id: [null],
      acquisition_date: [''],
      acquisition_cost: [null],
      warranty_start_date: [''],
      warranty_end_date: [''],
      budget_code: [''],
      budget_donor: [''],
      pr_id: [null],
      notes: ['']
    });
  }

  private loadAsset() {
    this.isLoading = true;
    this.assets.getAsset(this.assetId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (asset) => {
        this.asset = asset.data || asset;
        this.populateForm();
        this.loadCategoryAttributes();
        this.loadPrDetails();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading asset:', error);
        this.isLoading = false;
        // TODO: Show error message
      }
    });
  }

  private loadDropdownData() {
    // Load all dropdown data
    combineLatest([
      this.cats.getCategories(),
      this.assets.getStatuses(),
      this.assets.getLocations(),
      this.assets.getFloors(),
      this.assets.getSuppliers(),
      this.assets.getUsers()
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([categories, statuses, locations, floors, suppliers, users]) => {
        this.categories = categories;
        this.statuses = statuses;
        this.locations = locations;
        this.floors = floors;
        this.suppliers = suppliers;
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
      }
    });

    // Load subcategories and fixed items when category changes
    this.assetForm.get('fixed_item_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(fixedItemId => {
      if (fixedItemId && this.asset) {
        // Find the subcategory for this fixed item
        const fixedItem = this.fixedItems.find(fi => fi.id === fixedItemId);
        if (fixedItem) {
          this.cats.getSubCategories(fixedItem.sub_category_id).pipe(takeUntil(this.destroy$)).subscribe(subs => {
            this.subCategories = subs;
          });
        }
      }
    });
  }

  private loadCategoryAttributes() {
    // Note: category_id is not included in the asset response
    // Dynamic attributes loading is disabled until backend provides category_id
    console.log('Category attributes loading skipped - category_id not available in asset response');
    this.dynamicAttributes = [];
  }

  private loadPrDetails() {
    if (this.asset?.pr_id) {
      // For now, we'll just set a placeholder. In a real implementation,
      // you'd fetch the PR details from the backend
      // this.prService.getPr(this.asset.pr_id).subscribe(pr => {
      //   this.prCode = pr.pr_code;
      // });

      // Since we don't have a getPr method, we'll use a placeholder for now
      this.prCode = `PR-${this.asset.pr_id.toString().padStart(4, '0')}`;
    } else {
      this.prCode = '';
    }
  }

  private populateForm() {
    if (!this.asset || !this.assetForm) return;

    const formData = {
      sn: this.asset.sn || '',
      fixed_item_id: this.asset.fixed_item_id || null,
      description: this.asset.description || '',
      status_id: this.asset.status_id || null,
      location_id: this.asset.location_id || null,
      floor_id: this.asset.floor_id || null,
      supplier_id: this.asset.supplier_id || null,
      brand_id: this.asset.brand_id || null,
      color_id: this.asset.color_id || null,
      holder_user_id: this.asset.holder_user_id || null,
      acquisition_date: this.asset.acquisition_date || '',
      acquisition_cost: this.asset.acquisition_cost || null,
      warranty_start_date: this.asset.warranty_start_date || '',
      warranty_end_date: this.asset.warranty_end_date || '',
      budget_code: this.asset.budget_code || '',
      budget_donor: this.asset.budget_donor || '',
      pr_id: this.asset.pr_id || null,
      notes: this.asset.notes || ''
    };

    // Add dynamic attributes
    if (this.asset.attributes) {
      Object.keys(this.asset.attributes).forEach(key => {
        // Only add form controls for non-name attributes (avoid duplicates)
        if (!key.endsWith('_name') && !this.assetForm.get(key)) {
          this.assetForm.addControl(key, this.fb.control(null));
        }
        formData[key as keyof typeof formData] = this.asset.attributes[key];
      });
    }

    this.assetForm.patchValue(formData);

    // Note: sub_category_id is not available in asset response
    // Fixed items loading is disabled until backend provides sub_category_id
    console.log('Fixed items loading skipped - sub_category_id not available in asset response');
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForm(); // Reset form if canceling edit
    }
  }

  saveAsset() {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.assetForm.value;

    // Remove empty values
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || formData[key] === null) {
        delete formData[key];
      }
    });

    this.assets.updateAsset(this.assetId, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedAsset) => {
        this.asset = updatedAsset.data || updatedAsset;
        this.isEditing = false;
        this.isSaving = false;
        // TODO: Show success message
      },
      error: (error) => {
        console.error('Error updating asset:', error);
        this.isSaving = false;
        // TODO: Show error message
      }
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getAttributeLabel(fieldName: string): string {
    const attr = this.dynamicAttributes.find(a => a.field_name === fieldName);
    return attr ? attr.name : fieldName;
  }

  getAttributeOptions(fieldName: string): any[] {
    const attr = this.dynamicAttributes.find(a => a.field_name === fieldName);
    return attr?.options || [];
  }

  getAttributeFieldClass(attr: any): string {
    // Make full-width fields span the entire width
    return attr.fullWidth ? 'full-width' : '';
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-unknown';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('functional') || statusLower.includes('active') || statusLower.includes('new')) {
      return 'status-active';
    }
    if (statusLower.includes('maintenance') || statusLower.includes('repair')) {
      return 'status-maintenance';
    }
    if (statusLower.includes('storage') || statusLower.includes('available')) {
      return 'status-storage';
    }
    if (statusLower.includes('damaged') || statusLower.includes('lost') || statusLower.includes('stolen')) {
      return 'status-damaged';
    }
    return 'status-other';
  }

  getStatusIcon(status: string): string {
    if (!status) return 'help';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('functional') || statusLower.includes('active') || statusLower.includes('new')) {
      return 'check_circle';
    }
    if (statusLower.includes('maintenance') || statusLower.includes('repair')) {
      return 'build';
    }
    if (statusLower.includes('storage') || statusLower.includes('available')) {
      return 'inventory';
    }
    if (statusLower.includes('damaged') || statusLower.includes('lost') || statusLower.includes('stolen')) {
      return 'error';
    }
    return 'info';
  }

  getWarrantyPeriod(asset: any): string {
    if (!asset.warranty_start_date && !asset.warranty_end_date) {
      return 'Not specified';
    }
    if (asset.warranty_start_date && asset.warranty_end_date) {
      return `${asset.warranty_start_date} - ${asset.warranty_end_date}`;
    }
    if (asset.warranty_start_date) {
      return `Starts: ${asset.warranty_start_date}`;
    }
    if (asset.warranty_end_date) {
      return `Ends: ${asset.warranty_end_date}`;
    }
    return 'Not specified';
  }

  getAttributeKeys(attributes: any): string[] {
    if (!attributes) return [];
    // Filter out keys that end with '_name' as they're display names, not the actual attribute fields
    return Object.keys(attributes).filter(key => !key.endsWith('_name'));
  }

  getAttributeDisplayName(key: string): string {
    // Convert field names to display names
    const displayNames: { [key: string]: string } = {
      'material_id': 'Material',
      'size': 'Size/Capacity',
      'engine_type': 'Engine Type',
      'fuel_type': 'Fuel Type',
      'year': 'Year',
      'screen_size': 'Screen Size',
      'resolution': 'Resolution',
      'connectivity': 'Connectivity',
      'energy_rating': 'Energy Rating',
      'capacity': 'Capacity'
    };

    return displayNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
