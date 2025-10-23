import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PrEditRequestsService } from '../pr-edit-requests/pr-edit-requests.service'; 
import { ApiDetailResponse, ItemDiff, PrEditRequestDetailDto, PrHeaderDiffs } from '../pr-edit-requests/models';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-pr-edit-request-details',
  templateUrl: './pr-edit-request-details.component.html',
  styleUrls: ['./pr-edit-request-details.component.scss']
})
export class PrEditRequestDetailsComponent {

  loading = true;
  saving = false;
  error: string | null = null;
  detail: PrEditRequestDetailDto | null = null;
  reason = '';

  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private api: PrEditRequestsService,
    private toast: ToastService,
    private router: Router
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.fetch(id);
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  fetch(id: number) {
    this.loading = true;
    this.error = null;
    this.sub.add(
      this.api.getOne(id).subscribe({
        next: (res) => { this.detail = res.data; this.loading = false; console.log("pr edit details",this.detail)},
        error: (e) => { this.error = e?.error?.message || 'Failed to load request'; this.loading = false; }
      })
    );
  }

  // ---- helpers ----
  lcStatus() { return (this.detail?.status || '').toLowerCase(); }
  statusClass() {
    const s = this.lcStatus();
    return {
      'bg-amber-100 text-amber-700': s === 'pending',
      'bg-green-100 text-green-700': s === 'approved',
      'bg-rose-100 text-rose-700': s === 'rejected',
    };
  }

  /** Show changed only when `newVal` is not null/undefined and actually differs */
  showChanged<T>(oldVal: T | null | undefined, newVal: T | null | undefined): boolean {
    return newVal !== null && newVal !== undefined && oldVal !== newVal;
  }

  /** Return prefer-new-if-present, else old, else '—' */
  pref<T>(oldVal: T | null | undefined, newVal: T | null | undefined): T | string {
    return (newVal ?? oldVal) ?? '—';
  }

  /** Formatters */
  money(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
  // date strings can be ISO or 'YYYY-MM-DD'
  dateStr(s: string | null | undefined): string {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d as any)) return s; // fallback raw if invalid Date
    return d.toLocaleDateString();
  }

  prefNum(oldVal?: number | null, newVal?: number | null): number | null {
    return (newVal ?? oldVal) ?? null;
  }
  prefStr(oldVal?: string | null, newVal?: string | null): string | null {
    return (newVal ?? oldVal) ?? null;
  }
  prefDate(oldVal?: string | null, newVal?: string | null): string | null {
    return (newVal ?? oldVal) ?? null;
  }

  supplierLabel(val: any): string {
    if (!val && val !== 0) return '—';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    // object cases
    const id = (val && (val.id ?? val.supplier_id)) ?? null;
    const name = (val && (val.name ?? val.supplier_name ?? val.label)) ?? null;
    if (name && id != null) return `${name} `;
    if (name) return String(name);
    if (id != null) return `#${id}`;
    try { return JSON.stringify(val); } catch { return '—'; }
  }
  
  supplierOld(val: any, fallbackId?: any): string {
    return this.supplierLabel(val ?? fallbackId);
  }
  supplierNew(val: any, fallbackId?: any): string {
    return this.supplierLabel(val ?? fallbackId);
  }
  

  delta(oldVal: number | null | undefined, newVal: number | null | undefined): number {
    const o = oldVal ?? 0;
    const n = newVal ?? o;
    return n - o;
  }
  deltaClass(delta: number) {
    return {
      'text-green-700': delta < 0,
      'text-rose-700': delta > 0,
      'text-gray-700': delta === 0,
    };
  }

  isTouched(item: any, field: string) {
    return Array.isArray(item?.__touched) && item.__touched.includes(field);
  }

  // actions
  approve() {
    if (!this.detail) return;
    this.saving = true;
    this.api.approve(this.detail.id).subscribe({
      next: () => { this.toast.success('Edit request approved and applied.'); this.saving = false; this.router.navigate(['/dashboard/pr-edit-requests']); },
      error: e => { this.toast.error(e?.error?.message || 'Approval failed'); this.saving = false; }
    });
  }
  reject() {
    if (!this.detail) return;
    this.saving = true;
    this.api.reject(this.detail.id, this.reason).subscribe({
      next: () => { this.toast.success('Edit request rejected.'); this.saving = false; this.router.navigate(['/dashboard/pr-edit-requests']); },
      error: e => { this.toast.error(e?.error?.message || 'Rejection failed'); this.saving = false; }
    });
  }

  // trackBys
  trackIdx(i: number) { return i; }
  trackDiff(_i: number, d: ItemDiff) { return d.id ?? _i; }
}
