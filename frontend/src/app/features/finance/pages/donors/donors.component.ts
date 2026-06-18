import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DonorService } from '../../../../core/services/donor.service';
import { Donor } from '../../../../core/models/donor.model';
import { MatDialog } from '@angular/material/dialog';
import { DonorFormComponent } from './donor-form/donor-form.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-donors',
  templateUrl: './donors.component.html',
  styleUrls: ['./donors.component.scss']
})
export class DonorsComponent implements OnInit, OnDestroy {
  donors: Donor[] = [];
  loading = false;
  displayedColumns: string[] = ['account_no', 'donor', 'department', 'finance_officer', 'areas', 'end_date', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private donorService: DonorService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDonors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDonors(): void {
    this.loading = true;
    this.donorService.getDonors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donors) => {
          this.donors = donors;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading donors:', error);
          this.toastService.error('Failed to load donors');
          this.loading = false;
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DonorFormComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDonors();
      }
    });
  }

  viewDonor(donor: Donor): void {
    this.router.navigate(['/finance', donor.id]);
  }

  openEditDialog(donor: Donor): void {
    const dialogRef = this.dialog.open(DonorFormComponent, {
      width: '600px',
      data: donor
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDonors();
      }
    });
  }

  deleteDonor(donor: Donor): void {
    if (confirm(`Are you sure you want to delete donor "${donor.donor}"?`)) {
      this.donorService.deleteDonor(donor.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Donor deleted successfully');
            this.loadDonors();
          },
          error: (error) => {
            console.error('Error deleting donor:', error);
            const message = error?.error?.message || 'Failed to delete donor';
            this.toastService.error(message);
          }
        });
    }
  }

  getDepartmentLabel(dept?: string): string {
    if (!dept) return '—';
    const labels: Record<string, string> = {
      'education': 'Education',
      'protection': 'Protection',
      'FSL': 'FSL',
      'peace_building': 'Peace Building',
      'advocacy_research': 'Advocacy & Research',
      'support_community': 'Support Community',
      'basic_assistance_emergency': 'Basic Assistance & Emergency',
      'capacity_building_admin_support': 'Capacity Building & Admin Support'
    };
    return labels[dept] || dept;
  }

  getLocationsDisplay(locations?: Array<{ id: number; name: string }>): string {
    if (!locations || locations.length === 0) return '—';
    if (locations.length === 1) return locations[0].name;
    // Show all location names separated by comma
    return locations.map(loc => loc.name).join(', ');
  }
}
