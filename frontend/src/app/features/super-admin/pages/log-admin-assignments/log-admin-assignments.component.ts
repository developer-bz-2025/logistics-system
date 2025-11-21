import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import {
  LogAdminAssignmentsService,
  LogAdminCandidate,
  LocationOption,
  UserDetail,
} from './log-admin-assignments.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-log-admin-assignments',
  templateUrl: './log-admin-assignments.component.html',
  styleUrls: ['./log-admin-assignments.component.scss'],
})
export class LogAdminAssignmentsComponent implements OnInit, OnDestroy {
  @ViewChild('candidateInput', { static: false }) candidateInput?: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  searchCtrl = new FormControl('', { nonNullable: true });
  locationIdsCtrl = new FormControl<number[]>([], {
    nonNullable: true,
    validators: [Validators.required],
  });
  form = this.fb.group({
    location_ids: this.locationIdsCtrl,
  });

  candidates$!: Observable<LogAdminCandidate[]>;
  locations: LocationOption[] = [];
  selectedUser?: LogAdminCandidate;
  assignedAdmins: LogAdminCandidate[] = [];
  selectedUserDetail?: UserDetail;

  loadingCandidates = false;
  loadingLocations = false;
  loadingAssigned = false;
  loadingUserDetail = false;
  saving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private assignments: LogAdminAssignmentsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.loadAssignedAdmins();
    this.candidates$ = this.searchCtrl.valueChanges.pipe(
      startWith(this.searchCtrl.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        const query = term?.trim() ?? '';
        if (query.length < 2) {
          this.loadingCandidates = false;
          return of<LogAdminCandidate[]>([]);
        }
        this.loadingCandidates = true;
        return this.assignments.searchCandidates(query).pipe(
          finalize(() => (this.loadingCandidates = false)),
          catchError(() => {
            this.toast.error('Unable to load candidates. Please try again.');
            return of([]);
          })
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLocations(): void {
    this.loadingLocations = true;
    this.assignments
      .fetchLocations()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loadingLocations = false))
      )
      .subscribe({
        next: locations => {
          this.locations = [...locations].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        },
        error: () => this.toast.error('Failed to load locations.'),
      });
  }

  loadAssignedAdmins(): void {
    this.loadingAssigned = true;
    this.assignments
      .getAssignedAdmins()
      .pipe(
        map(admins => admins.sort((a, b) => a.name.localeCompare(b.name))),
        takeUntil(this.destroy$),
        finalize(() => (this.loadingAssigned = false))
      )
      .subscribe({
        next: admins => (this.assignedAdmins = admins),
        error: () => this.toast.error('Unable to load existing admins.'),
      });
  }

  onCandidateSelected(event: MatAutocompleteSelectedEvent): void {
    const candidate = event.option.value as LogAdminCandidate;
    this.selectedUser = candidate;
    const currentIds = candidate.locations?.map(loc => loc.id) ?? [];
    this.locationIdsCtrl.setValue(currentIds);
    this.setSearchValue(candidate.name, false);
    this.loadSelectedUserDetail(candidate.id);
  }

  clearSelection(): void {
    this.selectedUser = undefined;
    this.selectedUserDetail = undefined;
    this.form.reset();
    this.locationIdsCtrl.setValue([]);
    this.setSearchValue('', true);
  }

  prefillCandidate(candidate: LogAdminCandidate): void {
    this.selectedUser = candidate;
    const currentIds = candidate.locations?.map(loc => loc.id) ?? [];
    this.locationIdsCtrl.setValue(currentIds);
    this.setSearchValue(candidate.name, false, true);
    this.loadSelectedUserDetail(candidate.id);
  }

  displayCandidate(candidate?: LogAdminCandidate): string {
    return candidate?.name ?? '';
  }

  selectedUserLocationsLabel(): string {
    const locations = this.selectedUserDetail?.locations || this.selectedUser?.locations;
    if (!locations?.length) {
      return 'None';
    }
    return locations.map(loc => loc.name).join(', ');
  }

  submit(): void {
    if (!this.selectedUser) {
      this.toast.info('Pick a user before assigning locations.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const locationIds = this.locationIdsCtrl.value;
    if (!locationIds.length) {
      this.toast.info('Select at least one location.');
      return;
    }
    this.saving = true;
    this.assignments
      .assign(this.selectedUser.id, locationIds)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.toast.success('Locations assigned successfully.');
          this.selectedUser = {
            ...this.selectedUser!,
            locations: this.locations.filter(loc =>
              locationIds.includes(loc.id)
            ),
          };
          if (this.selectedUserDetail) {
            this.selectedUserDetail = {
              ...this.selectedUserDetail,
              locations: this.locations.filter(loc =>
                locationIds.includes(loc.id)
              ),
            };
          }
          this.loadAssignedAdmins();
        },
        error: () =>
          this.toast.error('Failed to save assignments. Please try again.'),
      });
  }

  get hasLocationError(): boolean {
    return !!(
      this.locationIdsCtrl.invalid &&
      (this.locationIdsCtrl.dirty || this.locationIdsCtrl.touched)
    );
  }

  trackByLocation = (_: number, loc: LocationOption) => loc.id;

  get selectedLocations(): LocationOption[] {
    const locations = this.selectedUserDetail?.locations ?? this.selectedUser?.locations;
    return locations ? [...locations] : [];
  }

  private loadSelectedUserDetail(userId: number): void {
    this.loadingUserDetail = true;
    this.assignments
      .getUserDetail(userId)
      .pipe(finalize(() => (this.loadingUserDetail = false)))
      .subscribe({
        next: detail => {
          this.selectedUserDetail = detail;
          if (detail.locations?.length) {
            this.locationIdsCtrl.setValue(detail.locations.map(loc => loc.id));
          }
        },
        error: () =>
          this.toast.error('Unable to load user locations. Please try again.'),
      });
  }

  private setSearchValue(value: string, emitEvent = true, selectText = false): void {
    this.searchCtrl.setValue(value, { emitEvent });
    this.focusSearchInput(selectText);
  }

  private focusSearchInput(selectText = false): void {
    setTimeout(() => {
      const inputEl = this.candidateInput?.nativeElement;
      if (inputEl) {
        inputEl.focus();
        if (selectText) {
          inputEl.select();
        }
      }
    });
  }
}

