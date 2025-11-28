import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PendingRequestDialogData {
  existingRequest: {
    id: number;
    current_location: string;
    requested_location: string;
    status: string;
    request_date: string;
  };
}

@Component({
  selector: 'app-pending-request-dialog',
  template: `
    <h2 mat-dialog-title>Pending Location Change Request</h2>
    <mat-dialog-content class="dialog-content">
      <p class="info-message">
        There is already a pending location change request for this item. Please wait for approval or rejection before submitting another request.
      </p>
      
      <div class="request-details">
        <div class="detail-row">
          <span class="label">Request ID:</span>
          <span class="value">#{{ data.existingRequest.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Current Location:</span>
          <span class="value">{{ data.existingRequest.current_location }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Requested Location:</span>
          <span class="value">{{ data.existingRequest.requested_location }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value status-badge" [ngClass]="getStatusClass(data.existingRequest.status)">
            {{ data.existingRequest.status }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Request Date:</span>
          <span class="value">{{ formatDate(data.existingRequest.request_date) }}</span>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="button" (click)="close()">
        Close
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .info-message {
      margin: 0 0 1.5rem 0;
      padding: 1rem;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      color: #92400e;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .request-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background-color: #f9fafb;
      border-radius: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .value {
      color: #1f2937;
      font-size: 0.875rem;
      text-align: right;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-badge.approved {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-badge.rejected {
      background-color: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class PendingRequestDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<PendingRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PendingRequestDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'approved') return 'approved';
    if (statusLower === 'rejected') return 'rejected';
    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}

