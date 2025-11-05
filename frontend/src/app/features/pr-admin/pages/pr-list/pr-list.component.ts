import { Component, OnInit, ChangeDetectionStrategy  } from '@angular/core';
import { PrService } from '../../services/pr.service';
import { PrItem, PrRow } from '../../models/pr';
import { ToastService } from 'src/app/core/services/toast.service';
import { BehaviorSubject, switchMap } from 'rxjs';


@Component({
  selector: 'app-pr-list',
  templateUrl: './pr-list.component.html',
  styleUrls: ['./pr-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrListComponent implements OnInit {
  // UI state
  q = '';
  page = 1;
  per_page = 10;

  // triggers
  private refresh$ = new BehaviorSubject<void>(undefined);

  loading$ = new BehaviorSubject<boolean>(false);
  rows$ = new BehaviorSubject<PrRow[]>([]);
  total$ = new BehaviorSubject<number>(0);
  currentPage$ = new BehaviorSubject<number>(1);
  lastPage$ = new BehaviorSubject<number>(1);

  // modal state
  itemsModalOpen$ = new BehaviorSubject<boolean>(false);
  modalPr?: PrRow;
  modalItems$ = new BehaviorSubject<PrItem[] | null>(null);
  modalLoading$ = new BehaviorSubject<boolean>(false);

  math:Math;

  constructor(private api: PrService, private toast: ToastService) {
    this.refresh$
      .pipe(
        switchMap(() => {
          this.loading$.next(true);
          return this.api.list({ search: this.q, page: this.page, per_page: this.per_page, include: 'items' });
        })
      )
      .subscribe({
        next: res => {
          this.rows$.next(res.data);
          this.total$.next(res.total ?? res.data.length);
          this.currentPage$.next(res.current_page ?? this.page);
          this.lastPage$.next(res.last_page ?? 1);
          this.loading$.next(false);
        },
        error: () => {
          this.loading$.next(false);
          this.toast.error('Failed to load PRs');
        }
      });
  }

  ngOnInit() { this.fetch(); }

  fetch() { this.refresh$.next(); }
  searchEnter() { this.page = 1; this.fetch(); }

  prev() { if (this.page > 1) { this.page--; this.fetch(); } }
  next() { if (this.page < (this.lastPage$.value || 1)) { this.page++; this.fetch(); } }

  // Open items modal: use items from row if present; otherwise load by id
  openItemsModal(row: PrRow) {
    this.modalPr = row;
    this.itemsModalOpen$.next(true);
  
    const items = row.items ?? [];  // if API didn’t include, fallback to []
    if (items.length) {
      this.modalItems$.next(items);
      return;
    }
  
    // (only when list didn't include items)
    this.modalLoading$.next(true);
    this.api.getItems(row.id).subscribe({
      next: list => { this.modalItems$.next(list ?? []); this.modalLoading$.next(false); },
      error: _ => { this.modalLoading$.next(false); this.modalItems$.next([]); this.toast.error('Failed to load items'); }
    });
  }
  
  closeItemsModal() {
    this.itemsModalOpen$.next(false);
    this.modalPr = undefined;
    this.modalItems$.next(null);
  }

  // docUrl(row: PrRow): string | null {
  //   const u =  row.pr_path;
  //   if (!u) return null;
  //   return String(u).startsWith('/') ? (location.origin + u) : String(u);
  // }

  // docUrl(row: PrRow): string | null {
  //   // if backend returns full URL use it; else build from storage path
  //   if (!row.pr_path) return null;
  //   // Example if you expose storage: `${environment.filesBase}/${row.pr_path}`
  //   return row.pr_path as string;
  // }

  // download(row: PrRow) {
  //   this.api.download(row.id).subscribe({
  //     next: (blob) => {
  //       const url = URL.createObjectURL(blob);
  //       window.open(url, '_blank');
  //       setTimeout(() => URL.revokeObjectURL(url), 10_000);
  //     },
  //     error: () => this.toast.error('Could not open document')
  //   });
  // }

  // docUrl(row: PrRow): string | null {
  //   console.log(row)
  //   return row.pr_path ? String(row.pr_path) : null; // must be absolute
  // }

  docUrl(row: PrRow): string | null {
    const raw = (row?.pr_path || '').trim();
    if (!raw) return null;
  
    // If backend already sent an absolute URL, just return it.
    if (/^https?:\/\//i.test(raw)) return raw;
  
    // Normalize: remove leading slashes
    const path = raw.replace(/^\/+/, '');
  
    // For Laravel public disk, the public URL is usually /storage/<path>
    // If the value doesn't already begin with 'storage/', prefix it.
    const rel = path.startsWith('storage/') ? path : `storage/${path}`;
  
    // Build an absolute URL based on current domain (localhost in dev, real domain in prod)
    return new URL(rel, window.location.origin + '/').toString();
  }

  pageRowNumber(i: number, currentPage: number | null | undefined): number {
    const cp = currentPage ?? 1;
    return ((cp - 1) * this.per_page) + i + 1;
  }
  
  pageEnd(cp: number | null | undefined, total: number | null | undefined): number {
    const c = (cp ?? 1) * this.per_page;
    const t = total ?? 0;
    return c < t ? c : t; // same as Math.min(c, t)
  }

  sumItems(items: PrItem[] | null | undefined): number {
    if (!items?.length) return 0;
    return items.reduce((s, r) => s + (r.qty * r.unit_cost), 0);
  }
}
