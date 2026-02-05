import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, takeUntil, forkJoin, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, map } from 'rxjs/operators';
import { AssetService, CategoryService } from 'src/app/core/services/category.service';
import { PrService, PrListItem } from 'src/app/core/services/pr.service';
import { Category, SubCategory, FixedItem, DynamicAttribute } from 'src/app/core/models/reference';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { MoveAssetDialogComponent } from './move-asset-dialog.component';
import { PendingRequestDialogComponent } from './pending-request-dialog.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SupplierService } from 'src/app/core/services/supplier.service';
import { UserService } from 'src/app/core/services/user.service';

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
  isUploadingPhoto = false;
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
  prs: PrListItem[] = [];
  dynamicAttributes: DynamicAttribute[] = [];
  canEditAsset = false;
  allowedMoveLocations: any[] = [];
  isRelocating = false;
  currentUser: any = null;
  userLocationIds: number[] = [];
  userRole: string | null = null;

  // History/Lifecycle
  history: any[] = [];
  historyLoading = false;
  historyPage = 1;
  historyPerPage = 15;
  historyTotal = 0;
  historyLastPage = 1;

  // Autocomplete observables
  filteredSuppliers$: Observable<any[]> = of([]);
  filteredUsers$: Observable<any[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private assets: AssetService,
    private cats: CategoryService,
    private prService: PrService,
    private auth: AuthService,
    private toast: ToastService,
    private dialog: MatDialog,
    private supplierService: SupplierService,
    private userService: UserService
  ) {
    this.assetId = Number(this.route.snapshot.paramMap.get('id'));
    this.assetForm = this.createForm();
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.userRole = this.resolveRoleName(user);
      // Extract location IDs - handle multiple possible structures
      const userLocations = (user as any)?.locations || [];
      this.userLocationIds = Array.isArray(userLocations) 
        ? userLocations.map((loc: any) => {
            // Handle both { id: number } and number formats
            return typeof loc === 'object' && loc !== null ? (loc.id ?? loc.location_id ?? loc) : loc;
          }).filter((id: any) => id != null && !isNaN(Number(id)))
        : [];
      
      console.log('[AssetDetail] User loaded from auth:', {
        userId: user?.id,
        role: this.userRole,
        locations: userLocations,
        locationIds: this.userLocationIds
      });
      
      // If locations are missing and user is log_admin, try fetching full user details
      if (this.userRole === 'log_admin' && (!userLocations || userLocations.length === 0) && user?.id) {
        console.log('[AssetDetail] Locations missing, fetching user details...');
        this.userService.getUser(user.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (fullUser: any) => {
            const fetchedLocations = fullUser?.locations || [];
            this.userLocationIds = Array.isArray(fetchedLocations)
              ? fetchedLocations.map((loc: any) => {
                  return typeof loc === 'object' && loc !== null ? (loc.id ?? loc.location_id ?? loc) : loc;
                }).filter((id: any) => id != null && !isNaN(Number(id)))
              : [];
            console.log('[AssetDetail] User details fetched:', {
              locations: fetchedLocations,
              locationIds: this.userLocationIds
            });
            // Update current user with locations if available
            if (fetchedLocations.length > 0) {
              this.currentUser = { ...this.currentUser, locations: fetchedLocations };
            }
            this.updatePermissions();
          },
          error: (err) => {
            console.error('[AssetDetail] Failed to fetch user details:', err);
            this.updatePermissions();
          }
        });
      } else {
        this.updatePermissions();
      }
    });
  }

  openPhotoPreview(): void {
    if (!this.asset?.photo_url) return;
    this.dialog.open(PhotoPreviewDialogComponent, {
      data: { url: this.asset.photo_url },
      panelClass: 'photo-preview-dialog',
    });
  }

  onPhotoEditClick(event: Event): void {
    event.stopPropagation(); // Prevent opening preview when clicking edit
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        this.updatePhoto(file);
      }
    };
    fileInput.click();
  }

  updatePhoto(file: File): void {
    if (!this.assetId) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select a valid image file', 'Invalid File');
      return;
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.toast.error('Image size must be less than 5MB', 'File Too Large');
      return;
    }

    this.isUploadingPhoto = true;
    this.assets.updateAssetPhoto(this.assetId, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Reload asset (which also reloads history) to get updated photo URL and new history entry
          this.loadAsset();
          this.isUploadingPhoto = false;
          this.toast.success(response?.message || 'Photo updated successfully', 'Update Photo');
        },
        error: (error) => {
          console.error('Error updating photo:', error);
          this.isUploadingPhoto = false;
          this.toast.error(error?.error?.message || 'Failed to update photo', 'Update Photo Failed');
        }
      });
  }

  ngOnInit() {
    this.loadAsset();
    this.loadDropdownData();
    this.setupAutocomplete();
  }

  private setupAutocomplete(): void {
    // Supplier autocomplete
    const supplierControl = this.assetForm.get('supplier_id');
    if (supplierControl) {
      this.filteredSuppliers$ = supplierControl.valueChanges.pipe(
        startWith(supplierControl.value || ''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          // If value is an object (selected), show it
          if (typeof value === 'object' && value !== null && value.id) {
            return of([value]);
          }
          // If value is a number (ID), find the supplier
          if (typeof value === 'number' && this.suppliers.length > 0) {
            const supplier = this.suppliers.find(s => s.id === value);
            return supplier ? of([supplier]) : this.supplierService.search('', {});
          }
          const searchValue = typeof value === 'string' ? value : '';
          if (!searchValue.trim()) {
            // If empty, return all suppliers or empty array
            return this.suppliers.length > 0 ? of(this.suppliers) : of([]);
          }
          return this.supplierService.search(searchValue, {});
        }),
        takeUntil(this.destroy$)
      );
    }

    // User autocomplete
    const userControl = this.assetForm.get('holder_user_id');
    if (userControl) {
      this.filteredUsers$ = userControl.valueChanges.pipe(
        startWith(userControl.value || ''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          // If value is an object (selected), show it
          if (typeof value === 'object' && value !== null && (value.id || value.label)) {
            return of([value]);
          }
          // If value is a number (ID), find the user
          if (typeof value === 'number' && this.users.length > 0) {
            const user = this.users.find(u => u.id === value);
            return user ? of([{ id: user.id, label: user.name }]) : this.userService.search('').pipe(
              map(users => users.map(u => ({ id: u.id, label: u.name })))
            );
          }
          const searchValue = typeof value === 'string' ? value : '';
          if (!searchValue.trim()) {
            // If empty, return empty array (don't load all users)
            return of([]);
          }
          return this.userService.search(searchValue).pipe(
            map(users => users.map(u => ({ id: u.id, label: u.name })))
          );
        }),
        takeUntil(this.destroy$)
      );
    }
  }

  get supplierControl(): FormControl {
    return this.assetForm.get('supplier_id') as FormControl;
  }

  get holderUserControl(): FormControl {
    return this.assetForm.get('holder_user_id') as FormControl;
  }

  displaySupplier(supplier: any): string {
    if (!supplier) return '';
    if (typeof supplier === 'object' && supplier.name) return supplier.name;
    if (typeof supplier === 'string') return supplier;
    return '';
  }

  displayUser(user: any): string {
    if (!user) return '';
    if (typeof user === 'object' && (user.name || user.label)) return user.name || user.label;
    if (typeof user === 'string') return user;
    return '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      sn: [''],
      description: [''],
      status_id: [null],
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
      notes: [''],
      attributes: this.fb.array([])
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
        this.loadHistory();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading asset:', error);
        this.isLoading = false;
        this.toast.error('Failed to load asset details.', 'Error');
      }
    });
  }

  private loadHistory(): void {
    if (!this.assetId) return;
    this.historyLoading = true;
    this.assets.getAssetHistory(this.assetId, this.historyPage, this.historyPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.history = res.data || [];
          this.historyTotal = res.total || 0;
          this.historyLastPage = res.last_page || 1;
          this.historyLoading = false;
        },
        error: (error) => {
          console.error('Error loading asset history:', error);
          this.history = [];
          this.historyLoading = false;
        }
      });
  }

  getEventIcon(eventType: string): string {
    const iconMap: { [key: string]: string } = {
      'location_changed': 'swap_horiz',
      'location_change_request_submitted': 'send',
      'location_change_request_approved': 'check_circle',
      'location_change_request_rejected': 'cancel',
      'status_changed': 'update',
      'holder_changed': 'person',
      'created': 'add_circle',
      'updated': 'edit'
    };
    return iconMap[eventType] || 'event';
  }

  getEventColor(eventType: string): string {
    if (eventType.includes('approved')) return 'text-green-600';
    if (eventType.includes('rejected')) return 'text-rose-600';
    if (eventType.includes('submitted')) return 'text-amber-600';
    return 'text-indigo-600';
  }

  formatHistoryDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  }

  formatFieldName(fieldName: string): string {
    const fieldMap: { [key: string]: string } = {
      'description': 'Description',
      'acquisition_date': 'Acquisition Date',
      'acquisition_cost': 'Acquisition Cost',
      'warranty_start_date': 'Warranty Start Date',
      'warranty_end_date': 'Warranty End Date',
      'status_id': 'Status',
      'location_id': 'Location',
      'floor_id': 'Floor',
      'supplier_id': 'Supplier',
      'brand_id': 'Brand',
      'color_id': 'Color',
      'holder_user_id': 'Holder',
      'sn': 'Serial Number',
      'budget_code': 'Budget Code',
      'budget_donor': 'Budget Donor',
      'notes': 'Notes'
    };
    return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatFieldValue(value: any, fieldName: string, valuesObject?: any): string {
    if (value === null || value === undefined || value === '') return '—';
    
    // Check if there's a corresponding _name field (e.g., status_id -> status_name)
    if (fieldName.endsWith('_id') && valuesObject) {
      const nameField = fieldName.replace('_id', '_name');
      if (valuesObject[nameField]) {
        return String(valuesObject[nameField]);
      }
      
      // Also check for supplier_id -> supplier_name, holder_user_id -> holder_name, etc.
      if (fieldName === 'supplier_id' && valuesObject.supplier_name) {
        return String(valuesObject.supplier_name);
      }
      if (fieldName === 'holder_user_id' && valuesObject.holder_name) {
        return String(valuesObject.holder_name);
      }
      if (fieldName === 'brand_id' && valuesObject.brand_name) {
        return String(valuesObject.brand_name);
      }
      if (fieldName === 'color_id' && valuesObject.color_name) {
        return String(valuesObject.color_name);
      }
      if (fieldName === 'location_id' && valuesObject.location_name) {
        return String(valuesObject.location_name);
      }
    }
    
    // Format dates
    if (fieldName.includes('date') || fieldName.includes('Date')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (e) {
        // If date parsing fails, return as is
      }
    }
    
    return String(value);
  }

  goToHistoryPage(page: number): void {
    if (page < 1 || page > this.historyLastPage) return;
    this.historyPage = page;
    this.loadHistory();
  }

  nextHistoryPage(): void {
    if (this.historyPage < this.historyLastPage) {
      this.historyPage++;
      this.loadHistory();
    }
  }

  previousHistoryPage(): void {
    if (this.historyPage > 1) {
      this.historyPage--;
      this.loadHistory();
    }
  }

  private loadDropdownData() {
    // Load all dropdown data
    combineLatest([
      this.cats.getCategories(),
      this.assets.getStatuses(),
      this.assets.getLocations(),
      this.assets.getFloors(),
      this.assets.getSuppliers(),
      this.assets.getUsers(),
      this.prService.getPrs()
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([categories, statuses, locations, floors, suppliers, users, prs]) => {
        this.categories = categories;
        this.statuses = statuses;
        this.locations = locations;
        this.floors = floors;
        this.suppliers = suppliers;
        this.users = users;
        this.prs = prs;
        // Reload PR details if asset is already loaded
        if (this.asset) {
          this.loadPrDetails();
          // Repopulate form to set supplier and user objects
          this.populateForm();
        }
        this.updatePermissions();
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
      }
    });
  }

  private loadCategoryAttributes() {
    if (!this.asset?.category_id) {
      this.dynamicAttributes = [];
      return;
    }

    const categoryId = this.asset.category_id;
    const subCategoryId = this.asset.sub_category_id;

    this.assets.getCategoryAttributes(categoryId, subCategoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attributes) => {
          this.dynamicAttributes = attributes || [];
          // Ensure asset is loaded before setting up form array
          if (this.asset) {
            this.setupAttributesFormArray();
          }
        },
        error: (error) => {
          console.error('Error loading category attributes:', error);
          this.dynamicAttributes = [];
        }
      });
  }

  private setupAttributesFormArray(): void {
    const attributesArray = this.assetForm.get('attributes') as FormArray;
    attributesArray.clear();

    this.dynamicAttributes.forEach((attr) => {
      const attributeId = attr.att_id ?? attr.id;
      const existingValue = this.getExistingAttributeValue(attr);
      
      const attrGroup = this.fb.group({
        att_id: [attributeId],
        att_option_id: [existingValue, attr.type === 'select' ? Validators.required : null]
      });
      
      attributesArray.push(attrGroup);
    });
  }

  private getExistingAttributeValue(attr: DynamicAttribute): any {
    if (!this.asset?.attributes) return null;
    
    // Attributes are stored with display names as keys (e.g., "Material", "Size/Capacity")
    // and option values as values (e.g., "leather", "medium")
    const attributeName = attr.name;
    const storedValue = this.asset.attributes[attributeName];
    
    if (storedValue === undefined || storedValue === null) {
      return null;
    }
    
    // For select type attributes, find the option that matches the stored value
    if (attr.type === 'select' && attr.options && attr.options.length > 0) {
      // Find the option where the value matches the stored value
      const foundOption = attr.options.find(opt => {
        // Compare the option's value (display text) with the stored value
        const optValue = opt.value || String(opt.id);
        return String(optValue).toLowerCase() === String(storedValue).toLowerCase();
      });
      
      if (foundOption) {
        // Return the option ID
        return typeof foundOption.id === 'string' && !isNaN(Number(foundOption.id))
          ? Number(foundOption.id)
          : foundOption.id;
      }
    }
    
    // For text and number types, return the stored value as is
    return storedValue;
  }

  private loadPrDetails() {
    if (this.asset?.pr_id && this.prs.length > 0) {
      const pr = this.prs.find(p => p.id === this.asset.pr_id);
      this.prCode = pr?.pr_code || '';
    } else {
      this.prCode = '';
    }
  }

  private populateForm() {
    if (!this.asset || !this.assetForm) return;

    // Find supplier object if supplier_id exists
    let supplierValue = this.asset.supplier_id || null;
    if (supplierValue && this.suppliers.length > 0) {
      const supplier = this.suppliers.find(s => s.id === supplierValue);
      if (supplier) {
        supplierValue = supplier;
      }
    }

    // Find user object if holder_user_id exists
    let userValue = this.asset.holder_user_id || null;
    if (userValue && this.users.length > 0) {
      const user = this.users.find(u => u.id === userValue);
      if (user) {
        userValue = { id: user.id, label: user.name };
      }
    }

    const formData: any = {
      sn: this.asset.sn || '',
      description: this.asset.description || '',
      status_id: this.asset.status_id || null,
      floor_id: this.asset.floor_id || null,
      supplier_id: supplierValue,
      brand_id: this.asset.brand_id || null,
      color_id: this.asset.color_id || null,
      holder_user_id: userValue,
      acquisition_date: this.asset.acquisition_date || '',
      acquisition_cost: this.asset.acquisition_cost || null,
      warranty_start_date: this.asset.warranty_start_date || '',
      warranty_end_date: this.asset.warranty_end_date || '',
      budget_code: this.asset.budget_code || '',
      budget_donor: this.asset.budget_donor || '',
      pr_id: this.asset.pr_id || null,
      notes: this.asset.notes || ''
    };

    this.assetForm.patchValue(formData);
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
    const formData: any = { ...this.assetForm.value };

    // Extract supplier_id from supplier object
    if (formData.supplier_id && typeof formData.supplier_id === 'object' && formData.supplier_id.id) {
      formData.supplier_id = formData.supplier_id.id;
    }

    // Extract holder_user_id from user object
    if (formData.holder_user_id && typeof formData.holder_user_id === 'object' && formData.holder_user_id.id) {
      formData.holder_user_id = formData.holder_user_id.id;
    }

    // Extract attributes from FormArray and ensure proper format
    if (formData.attributes && Array.isArray(formData.attributes)) {
      formData.attributes = formData.attributes
        .filter((attr: any) => 
          attr.att_id !== null && 
          attr.att_id !== undefined && 
          attr.att_option_id !== null && 
          attr.att_option_id !== undefined
        )
        .map((attr: any) => ({
          att_id: Number(attr.att_id),
          att_option_id: Number(attr.att_option_id)
        }));
    }

    // Remove empty values
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || formData[key] === null || 
          (Array.isArray(formData[key]) && formData[key].length === 0)) {
        delete formData[key];
      }
    });

    this.assets.updateAsset(this.assetId, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedAsset) => {
        this.isEditing = false;
        this.isSaving = false;
        this.toast.success('Asset updated successfully.', 'Update Asset');
        // Reload asset (which also reloads history) to get updated data and new history entry
        this.loadAsset();
      },
      error: (error) => {
        console.error('Error updating asset:', error);
        this.isSaving = false;
        this.toast.error('Failed to update asset. Please try again.', 'Update Asset Failed');
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

  get attributesFormArray(): FormArray {
    return this.assetForm.get('attributes') as FormArray;
  }

  getAttributeFormGroup(index: number): FormGroup {
    return this.attributesFormArray.at(index) as FormGroup;
  }

  getAttributeByIndex(index: number): DynamicAttribute {
    return this.dynamicAttributes[index];
  }

  getSelectedPrCode(): string {
    const prId = this.assetForm.get('pr_id')?.value;
    if (!prId) return '';
    const pr = this.prs.find(p => p.id === prId);
    return pr?.pr_code || '';
  }

  getSelectedPr(): any {
    const prId = this.assetForm.get('pr_id')?.value;
    if (!prId) return null;
    return this.prs.find(p => p.id === prId) || null;
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
      console.log('[AssetDetail] updatePermissions: No asset or user', {
        hasAsset: !!this.asset,
        hasUser: !!this.currentUser
      });
      return;
    }

    const role = this.userRole;
    const assetLocationId = this.asset.location_id;
    const availableLocations = (this.locations?.length ? this.locations : ((this.currentUser as any)?.locations || [])) || [];

    console.log('[AssetDetail] updatePermissions:', {
      role,
      assetLocationId,
      userLocationIds: this.userLocationIds,
      locationMatch: assetLocationId ? this.userLocationIds.includes(assetLocationId) : false,
      availableLocationsCount: availableLocations.length
    });

    if (role === 'super_admin') {
      this.canEditAsset = false;
      this.allowedMoveLocations = [];
      return;
    }

    if (role === 'log_admin') {
      // For log_admin, check if asset location matches any of user's locations
      // Also handle case where location_id might be a number or string
      const assetLocId = assetLocationId != null ? Number(assetLocationId) : null;
      const hasMatchingLocation = assetLocId != null && this.userLocationIds.some(id => Number(id) === assetLocId);
      this.canEditAsset = hasMatchingLocation;
      this.allowedMoveLocations = availableLocations;
      console.log('[AssetDetail] log_admin permissions:', {
        assetLocId,
        hasMatchingLocation,
        canEditAsset: this.canEditAsset
      });
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
