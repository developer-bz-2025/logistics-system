import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DonorListItem } from '../../../../core/models/donor.model';

@Component({
  selector: 'app-step-extra-info',
  templateUrl: './step-extra-info.component.html',
  styleUrls: ['./step-extra-info.component.scss']
})
export class StepExtraInfoComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() photoPreviewUrl: string | null = null;
  @Input() donors: DonorListItem[] = [];
  @Output() photoChange = new EventEmitter<File | null>();

  selectedDonorPolicies: string[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const donorControl = this.form.get('donor_id');
    if (!donorControl) {
      return;
    }

    this.updateSelectedDonorPolicies(donorControl.value);
    donorControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(donorId => this.updateSelectedDonorPolicies(donorId));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSelectedDonorPolicies(donorId: number | null): void {
    if (!donorId) {
      this.selectedDonorPolicies = [];
      return;
    }

    const donor = this.donors.find(item => item.id === donorId);
    this.selectedDonorPolicies = donor?.policies || [];
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.photoChange.emit(file);
    if (input) {
      input.value = '';
    }
  }

  clearPhoto(): void {
    this.photoChange.emit(null);
  }
}
