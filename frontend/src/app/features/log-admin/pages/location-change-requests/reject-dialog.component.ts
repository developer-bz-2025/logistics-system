import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LocationChangeRequest } from './location-change-requests.service';

@Component({
  selector: 'app-reject-dialog',
  template: `
    <h2 mat-dialog-title>Reject Location Change Request</h2>
    <mat-dialog-content>
      <p class="mb-4">
        Are you sure you want to reject the location change request for:
      </p>
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="font-medium">{{ data.request.item.fixed_item_name }}</div>
        <div class="text-sm text-gray-600 mt-1">
          From: <span class="font-medium">{{ data.request.current_location.name }}</span><br>
          To: <span class="font-medium">{{ data.request.requested_location.name }}</span>
        </div>
      </div>
      <mat-form-field class="w-full">
        <mat-label>Rejection Reason (optional)</mat-label>
        <textarea
          matInput
          rows="3"
          [(ngModel)]="reason"
          placeholder="Enter reason for rejection..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="confirm()">Reject</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class RejectDialogComponent {
  reason: string = '';

  constructor(
    public dialogRef: MatDialogRef<RejectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: LocationChangeRequest }
  ) {}

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close({ reason: this.reason });
  }
}

