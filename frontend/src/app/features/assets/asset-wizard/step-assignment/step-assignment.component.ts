import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-step-assignment',
  templateUrl: './step-assignment.component.html',
  styleUrls: ['./step-assignment.component.scss']
})
export class StepAssignmentComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() locations: any[] = [];
  @Input() floors: any[] = [];
  @Input() statuses: any[] = [];
  @Input() searchUsersFn!: (search: string) => Observable<any[]>;

  private destroy$ = new Subject<void>();

  // Filtered options for autocomplete
  filteredUsers$: Observable<any[]> = of([]);

  ngOnInit(): void {
    this.setupUserAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUserAutocomplete(): void {
    const userControl = this.form.get('holder_user_id');
    if (userControl && this.searchUsersFn) {
      this.filteredUsers$ = userControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          // If value is an object (selected), don't search
          if (typeof value === 'object' && value !== null) {
            return of([]);
          }
          const searchValue = typeof value === 'string' ? value : '';
          return this.searchUsersFn(searchValue);
        }),
        takeUntil(this.destroy$)
      );

    }
  }

  // Display function for autocomplete
  displayUser(user: any): string {
    return user && (user.name || user.label) ? (user.name || user.label) : '';
  }
}
