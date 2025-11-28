import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Subject, switchMap, takeUntil, startWith } from 'rxjs';
import { ReferencesService, ReferenceItem, ReferenceType } from './references.service';
import { ReferenceFormDialogComponent, ReferenceFormDialogData } from './reference-form-dialog.component';

interface ReferenceTab {
  key: ReferenceType;
  label: string;
  description: string;
  items: ReferenceItem[];
  loading: boolean;
}

@Component({
  selector: 'app-references',
  templateUrl: './references.component.html',
  styleUrls: ['./references.component.scss'],
})
export class ReferencesComponent implements OnInit, OnDestroy {
  tabs: ReferenceTab[] = [
    { key: 'locations', label: 'Locations', description: 'Offices and warehouses', items: [], loading: false },
    { key: 'brands', label: 'Brands', description: 'Asset brands', items: [], loading: false },
    { key: 'suppliers', label: 'Suppliers', description: 'Vendors and partners', items: [], loading: false },
    { key: 'floors', label: 'Floors', description: 'Building floors', items: [], loading: false },
  ];
  selectedTabIndex = 0;
  private refresh$ = new Subject<ReferenceType>();
  private destroy$ = new Subject<void>();
  searchCtrl = new FormControl('', { nonNullable: true });
  private tabFilters = new Map<ReferenceType, string>();

  constructor(private refs: ReferencesService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(startWith(this.searchCtrl.value), takeUntil(this.destroy$))
      .subscribe(value => {
        const type = this.tabs[this.selectedTabIndex]?.key;
        if (type) {
          this.tabFilters.set(type, value?.trim().toLowerCase() ?? '');
        }
      });

    this.refresh$
      .pipe(
        switchMap(type => {
          const tab = this.getTab(type);
          if (!tab) return [];
          tab.loading = true;
          return this.refs.list(type).pipe(
            takeUntil(this.destroy$),
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (items: any) => {
          const tab = this.tabs[this.selectedTabIndex];
          if (tab) {
            tab.items = items ?? [];
            tab.loading = false;
          }
        },
        error: () => {
          const tab = this.tabs[this.selectedTabIndex];
          if (tab) tab.loading = false;
        },
      });

    this.loadCurrentTab();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    const filterValue = this.tabFilters.get(this.tabs[index].key) ?? '';
    this.searchCtrl.setValue(filterValue, { emitEvent: false });
    this.loadCurrentTab();
  }

  loadCurrentTab(): void {
    const type = this.tabs[this.selectedTabIndex]?.key;
    if (type) {
      this.refresh$.next(type);
    }
  }

  openCreateDialog(): void {
    const tab = this.tabs[this.selectedTabIndex];
    if (!tab) return;
    this.openDialog({ type: tab.key, title: `Add ${tab.label.slice(0, -1)}` });
  }

  openEditDialog(item: ReferenceItem): void {
    const tab = this.tabs[this.selectedTabIndex];
    if (!tab) return;
    this.openDialog({
      type: tab.key,
      title: `Edit ${tab.label.slice(0, -1)}`,
      item,
    });
  }

  deleteItem(item: ReferenceItem): void {
    const tab = this.tabs[this.selectedTabIndex];
    if (!tab || !confirm(`Delete ${item.name}?`)) return;
    tab.loading = true;
    this.refs
      .delete(tab.key, item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadCurrentTab(),
        error: () => (tab.loading = false),
      });
  }

  private openDialog(data: ReferenceFormDialogData): void {
    const dialogRef = this.dialog.open(ReferenceFormDialogComponent, {
      width: '420px',
      data,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const tab = this.tabs[this.selectedTabIndex];
      if (!tab) return;
      tab.loading = true;
      const action$ = result.id
        ? this.refs.update(result.type, result.id, { name: result.name })
        : this.refs.create(result.type, { name: result.name });
      action$.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.loadCurrentTab(),
        error: () => (tab.loading = false),
      });
    });
  }

  private getTab(type: ReferenceType): ReferenceTab | undefined {
    return this.tabs.find(t => t.key === type);
  }

  filteredItems(tab: ReferenceTab): ReferenceItem[] {
    const term = (this.tabFilters.get(tab.key) ?? '').toLowerCase();
    if (!term) return tab.items;
    return tab.items.filter(item => item.name?.toLowerCase().includes(term));
  }
}

