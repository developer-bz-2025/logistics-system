import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface MoveAssetDialogData {
  locations: { id: number; name: string }[];
  currentLocationId?: number | null;
}

@Component({
  selector: 'app-move-asset-dialog',
  templateUrl: './move-asset-dialog.component.html',
  styleUrls: ['./move-asset-dialog.component.scss']
})
export class MoveAssetDialogComponent {
  selectedLocationId: number | null;

  constructor(
    private dialogRef: MatDialogRef<MoveAssetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MoveAssetDialogData
  ) {
    this.selectedLocationId = data.currentLocationId ?? null;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.selectedLocationId) {
      this.dialogRef.close(this.selectedLocationId);
    }
  }
}

