import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DonorService } from '../../../../../core/services/donor.service';
import { Donor, DonorDocument } from '../../../../../core/models/donor.model';
import { DonorFormComponent } from '../donor-form/donor-form.component';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-donor-detail',
  templateUrl: './donor-detail.component.html',
  styleUrls: ['./donor-detail.component.scss']
})
export class DonorDetailComponent implements OnInit, OnDestroy {
  donor: Donor | null = null;
  documents: DonorDocument[] = [];
  loading = false;
  uploading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private donorService: DonorService,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = Number(params.get('id'));
        if (id) {
          this.loadDonor(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDonor(id: number): void {
    this.loading = true;
    this.donorService.getDonor(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donor) => {
          this.donor = donor;
          this.documents = donor.documents || [];
          this.loading = false;
        },
        error: () => {
          this.toastService.error('Failed to load donor details');
          this.loading = false;
          this.router.navigateByUrl('/finance');
        }
      });
  }

  openEditDialog(): void {
    if (!this.donor) return;

    const dialogRef = this.dialog.open(DonorFormComponent, {
      width: '600px',
      data: this.donor
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.donor) {
        this.loadDonor(this.donor.id);
      }
    });
  }

  onFileSelected(event: Event): void {
    if (!this.donor) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.donorService.uploadDonorDocument(this.donor.id, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doc) => {
          this.documents = [doc, ...this.documents];
          this.toastService.success('Document uploaded successfully');
          this.uploading = false;
          input.value = '';
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to upload document';
          this.toastService.error(message);
          this.uploading = false;
          input.value = '';
        }
      });
  }

  deleteDocument(doc: DonorDocument): void {
    if (!this.donor) return;

    if (!confirm(`Delete document "${doc.original_name}"?`)) return;

    this.donorService.deleteDonorDocument(this.donor.id, doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== doc.id);
          this.toastService.success('Document deleted');
        },
        error: () => {
          this.toastService.error('Failed to delete document');
        }
      });
  }

  backToList(): void {
    this.router.navigateByUrl('/finance');
  }

  getDepartmentLabel(dept?: string): string {
    if (!dept) return '—';
    const labels: Record<string, string> = {
      education: 'Education',
      protection: 'Protection',
      FSL: 'FSL',
      peace_building: 'Peace Building',
      advocacy_research: 'Advocacy & Research',
      support_community: 'Support Community',
      basic_assistance_emergency: 'Basic Assistance & Emergency',
      capacity_building_admin_support: 'Capacity Building & Admin Support',
    };
    return labels[dept] || dept;
  }

  getLocationsDisplay(): string {
    const locations = this.donor?.locations;
    if (!locations || locations.length === 0) return '—';
    return locations.map(loc => loc.name).join(', ');
  }
}
