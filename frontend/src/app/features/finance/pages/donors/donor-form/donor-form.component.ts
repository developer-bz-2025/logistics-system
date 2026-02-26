import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DonorService } from '../../../../../core/services/donor.service';
import { Donor } from '../../../../../core/models/donor.model';
import { AssetService } from '../../../../../core/services/category.service';
import { UserService } from '../../../../../core/services/user.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-donor-form',
  templateUrl: './donor-form.component.html',
  styleUrls: ['./donor-form.component.scss']
})
export class DonorFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isEdit = false;
  loading = false;
  locations: any[] = [];
  users: any[] = [];
  
  departmentOptions = [
    { value: 'education', label: 'Education' },
    { value: 'protection', label: 'Protection' },
    { value: 'FSL', label: 'FSL' },
    { value: 'peace_building', label: 'Peace Building' },
    { value: 'advocacy_research', label: 'Advocacy & Research' },
    { value: 'support_community', label: 'Support Community' },
    { value: 'basic_assistance_emergency', label: 'Basic Assistance & Emergency' },
    { value: 'capacity_building_admin_support', label: 'Capacity Building & Admin Support' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private donorService: DonorService,
    private assetService: AssetService,
    private userService: UserService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<DonorFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Donor | null
  ) {
    this.isEdit = !!data;
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.loadLocations();
    this.loadUsers();
    
    if (this.data) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      account_no: [''],
      department_name: [''],
      finance_officer_id: [null],
      donor: ['', Validators.required],
      end_date: [null],
      notes: [''],
      location_ids: [[]]
    });
  }

  private populateForm(): void {
    if (!this.data) return;
    
    const locationIds = this.data.locations?.map(loc => loc.id) || [];
    
    this.form.patchValue({
      account_no: this.data.account_no || '',
      department_name: this.data.department_name || '',
      finance_officer_id: this.data.finance_officer_id || null,
      donor: this.data.donor,
      end_date: this.data.end_date || null,
      notes: this.data.notes || '',
      location_ids: locationIds
    });
  }

  private loadLocations(): void {
    this.assetService.getLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locations = locations || [];
        },
        error: (error) => {
          console.error('Error loading locations:', error);
        }
      });
  }

  private loadUsers(): void {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          // Filter to only show users with finance role
          this.users = (users || []).filter((user: any) => {
            const roleName = user?.role?.name || (user as any)?.role;
            return roleName === 'finance' || String(roleName).toLowerCase() === 'finance';
          });
        },
        error: (error) => {
          console.error('Error loading users:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const donorData: Partial<Donor> & { location_ids?: number[] } = {
      account_no: formValue.account_no || null,
      department_name: formValue.department_name || null,
      finance_officer_id: formValue.finance_officer_id || null,
      donor: formValue.donor,
      end_date: formValue.end_date || null,
      notes: formValue.notes || null,
      location_ids: formValue.location_ids || []
    };

    const operation = this.isEdit
      ? this.donorService.updateDonor(this.data!.id, donorData)
      : this.donorService.createDonor(donorData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success(`Donor ${this.isEdit ? 'updated' : 'created'} successfully`);
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error saving donor:', error);
          const message = error?.error?.message || `Failed to ${this.isEdit ? 'update' : 'create'} donor`;
          this.toastService.error(message);
          this.loading = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
