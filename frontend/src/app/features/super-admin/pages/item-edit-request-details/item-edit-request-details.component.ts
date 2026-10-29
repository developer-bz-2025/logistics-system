import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ItemEditRequestsService } from '../item-edit-requests/item-edit-requests.service';
import { ItemAttributeDiff, ItemEditRequestDetail, ItemFieldDiff } from '../item-edit-requests/models';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-item-edit-request-details',
  templateUrl: './item-edit-request-details.component.html',
  styleUrls: ['./item-edit-request-details.component.scss']
})
export class ItemEditRequestDetailsComponent implements OnDestroy {
  loading = true;
  saving = false;
  error: string | null = null;
  detail: ItemEditRequestDetail | null = null;
  reason = '';

  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private api: ItemEditRequestsService,
    private toast: ToastService,
    private router: Router
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.fetch(id);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  fetch(id: number) {
    this.loading = true;
    this.error = null;
    this.sub.add(
      this.api.getOne(id).subscribe({
        next: (res) => {
          this.detail = res.data;
          this.loading = false;
        },
        error: (e) => {
          this.error = e?.error?.message || 'Failed to load request';
          this.loading = false;
        }
      })
    );
  }

  lcStatus() {
    return (this.detail?.status || '').toLowerCase();
  }

  isPending() {
    const s = this.lcStatus();
    return s === 'pending' || s === 'pending approval';
  }

  statusClass() {
    const s = this.lcStatus();
    return {
      'bg-amber-100 text-amber-700': s === 'pending' || s === 'pending approval',
      'bg-green-100 text-green-700': s === 'approved',
      'bg-rose-100 text-rose-700': s === 'rejected',
    };
  }

  displayValue(diff: ItemFieldDiff, side: 'old' | 'new'): string {
    const label = side === 'old' ? diff.old_label : diff.new_label;
    const raw = side === 'old' ? diff.old : diff.new;
    if (label !== null && label !== undefined && label !== '') {
      return String(label);
    }
    if (raw === null || raw === undefined || raw === '') {
      return '—';
    }
    return String(raw);
  }

  approve() {
    if (!this.detail) return;
    this.saving = true;
    this.api.approve(this.detail.id).subscribe({
      next: () => {
        this.toast.success('Asset edit request approved and applied.');
        this.saving = false;
        this.router.navigate(['/dashboard/item-edit-requests']);
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Approval failed');
        this.saving = false;
      }
    });
  }

  reject() {
    if (!this.detail) return;
    this.saving = true;
    this.api.reject(this.detail.id, this.reason || undefined).subscribe({
      next: () => {
        this.toast.success('Asset edit request rejected.');
        this.saving = false;
        this.router.navigate(['/dashboard/item-edit-requests']);
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Rejection failed');
        this.saving = false;
      }
    });
  }

  trackField(_i: number, d: ItemFieldDiff) {
    return d.field;
  }

  trackAttr(_i: number, d: ItemAttributeDiff) {
    return d.att_id;
  }
}
