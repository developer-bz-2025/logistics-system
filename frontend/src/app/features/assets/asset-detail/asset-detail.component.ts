import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { AssetService, CategoryService } from 'src/app/core/services/category.service';
import { PrService } from 'src/app/core/services/pr.service';
import { Category, SubCategory, FixedItem } from 'src/app/core/models/reference';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { MoveAssetDialogComponent } from './move-asset-dialog.component';
import { PendingRequestDialogComponent } from './pending-request-dialog.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

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
  canEditAsset = false;
  allowedMoveLocations: any[] = [];
  isRelocating = false;
  currentUser: any = null;
  userLocationIds: number[] = [];
  userRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private assets: AssetService,
    private cats: CategoryService,
    private prService: PrService,
    private auth: AuthService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {
    this.assetId = Number(this.route.snapshot.paramMap.get('id'));
    this.assetForm = this.createForm();
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.userRole = this.resolveRoleName(user);
      this.userLocationIds = ((user as any)?.locations || []).map((loc: any) => loc.id);
      this.updatePermissions();
    });
  }

  openPhotoPreview(): void {
    if (!this.asset?.photo_url) return;
    this.dialog.open(PhotoPreviewDialogComponent, {
      data: { url: this.asset.photo_url },
      panelClass: 'photo-preview-dialog',
    });
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
        this.updatePermissions();
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
        this.updatePermissions();
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
    if (!this.isEditing && !this.canEditAsset) {
      return;
    }
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

  private resolveRoleName(user: any): string | null {
    if (!user) return null;
    const role = (user.role?.name) ?? (Array.isArray(user.role) ? user.role[0] : user.role) ?? (Array.isArray(user.roles) ? user.roles[0] : user.roles);
    if (!role) return null;
    if (typeof role === 'string') return role.toLowerCase();
    if (typeof role === 'object' && typeof role.name === 'string') return role.name.toLowerCase();
    return null;
  }

  private updatePermissions(): void {
    if (!this.asset || !this.currentUser) {
      this.canEditAsset = false;
      return;
    }

    const role = this.userRole;
    const assetLocationId = this.asset.location_id;
    const availableLocations = (this.locations?.length ? this.locations : ((this.currentUser as any)?.locations || [])) || [];

    if (role === 'super_admin') {
      this.canEditAsset = false;
      this.allowedMoveLocations = [];
      return;
    }

    if (role === 'log_admin') {
      this.canEditAsset = !!assetLocationId && this.userLocationIds.includes(assetLocationId);
      this.allowedMoveLocations = availableLocations;
      return;
    }

    this.canEditAsset = true;
    this.allowedMoveLocations = availableLocations;
  }

  openMoveAssetDialog(): void {
    if (!this.canEditAsset || !this.allowedMoveLocations?.length || this.isRelocating) {
      return;
    }
    const dialogRef = this.dialog.open(MoveAssetDialogComponent, {
      width: '500px',
      data: {
        locations: this.allowedMoveLocations,
        currentLocationId: this.asset?.location_id
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result?: { locationId: number; notes?: string }) => {
      if (result && result.locationId && result.locationId !== this.asset?.location_id) {
        this.moveAsset(result.locationId, result.notes);
      }
    });
  }

  private moveAsset(requestedLocationId: number, notes?: string): void {
    this.isRelocating = true;
    this.assets.moveAsset(this.assetId, requestedLocationId, notes).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        // Reload the asset to get updated data
        this.loadAsset();
        this.isRelocating = false;
        const message = response?.message || 'Asset move request submitted successfully.';
        this.toast.success(message, 'Move Asset');
      },
      error: (error) => {
        console.error('Error moving asset:', error);
        this.isRelocating = false;
        
        // Check if this is a pending request error
        const existingRequest = error?.error?.existing_request;
        const itemIdErrors = error?.error?.errors?.item_id;
        const hasPendingRequestError = existingRequest && 
                                      itemIdErrors && 
                                      Array.isArray(itemIdErrors) && 
                                      itemIdErrors.length > 0;
        
        if (hasPendingRequestError) {
          // Show dialog with existing request details
          this.dialog.open(PendingRequestDialogComponent, {
            width: '500px',
            data: {
              existingRequest: existingRequest
            }
          });
          // Also show a toast with the main message
          const errorMessage = error?.error?.message || 'A pending location change request already exists for this item.';
          this.toast.error(errorMessage, 'Move Asset Failed', 5000);
        } else {
          // Regular error handling
          const errorMessage = error?.error?.message || 'Failed to move asset. Please try again.';
          this.toast.error(errorMessage, 'Move Asset Failed');
        }
      }
    });
  }
}

@Component({
  selector: 'app-photo-preview-dialog',
  template: `
    <div class="photo-preview">
      <img [src]="data.url" alt="Asset photo" />
    </div>
  `,
  styles: [
    `
      .photo-preview {
        max-width: 90vw;
        max-height: 90vh;
      }
      .photo-preview img {
        width: 100%;
        height: auto;
        max-height: 90vh;
        object-fit: contain;
      }
    `,
  ],
})
export class PhotoPreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {}
}
