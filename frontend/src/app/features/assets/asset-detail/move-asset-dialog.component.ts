import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface MoveAssetDialogData {
  locations: { id: number; name: string }[];
  currentLocationId?: number | null;
}

export interface MoveAssetResult {
  locationId: number;
  notes?: string;
}

@Component({
  selector: 'app-move-asset-dialog',
  templateUrl: './move-asset-dialog.component.html',
  styleUrls: ['./move-asset-dialog.component.scss']
})
export class MoveAssetDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<MoveAssetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MoveAssetDialogData,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      locationId: [data.currentLocationId ?? null, Validators.required],
      notes: ['']
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.valid) {
      const result: MoveAssetResult = {
        locationId: this.form.value.locationId,
        notes: this.form.value.notes?.trim() || undefined
      };
      this.dialogRef.close(result);
    }
  }
}

