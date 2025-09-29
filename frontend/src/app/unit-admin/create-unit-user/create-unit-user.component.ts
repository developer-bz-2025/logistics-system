import { Component, ChangeDetectionStrategy, OnInit,ChangeDetectorRef  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JwtService } from 'src/app/core/services/jwt.service';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from 'src/app/core/services/user.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { AuthService } from 'src/app/core/services/auth.service'; // assumed: exposes current user
import { L } from '@angular/cdk/keycodes';

interface Employee {
  id: number;
  name: string;
  position: string;
  email: string;
}

interface CurrentUser {
  id: number;
  role: 'unit_admin' | string;
  unit_id: number | null;
}

@Component({
  selector: 'app-create-unit-user',
  templateUrl: './create-unit-user.component.html',
  styleUrls: ['./create-unit-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateUnitUserComponent implements OnInit {
  loading = true;
  loadingEmployees = false;
  fatalBlocker = '';
  user: any;
  adminUnitId: number | null = null;
  adminUnitName = '';
  adminUnitMeta = '';

  form!: FormGroup;

  serverErrors: string[] = [];                           // general (top of form)
fieldErrors: Record<string, string[]> = {};

  // Only these two roles are allowed
  roles = [
    {
      key: 'unit_admin',
      title: 'Unit Admin',
      description: 'Administrative access for this unit only.',
      icon: 'users',
      tags: [
        { label: 'Admin Access', color: 'bg-blue-100 text-blue-700' },
        { label: 'Management',  color: 'bg-orange-100 text-orange-700' }
      ]
    },
    {
      key: 'standard',
      title: 'Standard',
      description: 'Basic access to this unit’s resources.',
      icon: 'user',
      tags: [
        { label: 'Basic Access', color: 'bg-gray-100 text-gray-700' },
        { label: 'Standard',     color: 'bg-green-100 text-green-700' }
      ]
    }
  ];


  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchQuery = '';

  message = '';
  submitting = false;


  constructor(
    private jwtService: JwtService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private unitService: UnitService,
    private auth: AuthService, // must provide current user
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: ['', Validators.required],
      role: ['', Validators.required],       // 'unit_admin' | 'standard'
      unit_id: ['', Validators.required],    // locked to admin unit
    });

    const userId = this.jwtService.getUserId();

    // If there is no user id, block and stop loading
    if (!userId) {
      this.fatalBlocker = 'You are not authenticated. Please login again.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    // Fetch current user, settle loading in ALL cases
    this.userService.getUser(+userId).pipe(
      finalize(() => {
        // finalize runs for both success and error
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (d) => {
        this.user = d;

        // ensure has unit
        if (!this.user?.unit_id) {
          this.fatalBlocker = 'Your account is not assigned to a unit. Please contact an administrator.';
          return; // loading already turned off in finalize
        }

        // set context
        this.adminUnitId = this.user.unit_id;
        this.form.patchValue({ unit_id: this.adminUnitId });

        this.adminUnitName = this.user?.unit_name || `Unit #${this.adminUnitId}`;
        if (this.user?.country?.country_name || this.user?.entity?.entity_name) {
          this.adminUnitMeta = [this.user.country?.country_name, this.user.entity?.entity_name]
            .filter(Boolean).join(' / ');
        }

        // now that unit context is ready, load employees
        this.loadEmployees();
      },
      error: (err) => {
        // show a helpful message AND stop loading (done in finalize)
        this.fatalBlocker = 'Unable to load your profile. Please refresh or contact admin.';
        console.error('getUser failed', err);
      }
    });
    // const me: CurrentUser | null = this.auth.currentUser(); // or this.auth.currentUserValue / observable
    // if (!me || me.role !== 'unit_admin') {
    //   this.fatalBlocker = 'This page is only available to Unit Admins.';
    //   this.loading = false;
    //   return;
    // }
   

    // 2) Load unit details for display (name + context)
    // this.unitService.getUnitById(this.adminUnitId).subscribe({
    //   next: (u: any) => {
    //     this.adminUnitName = u?.unit_name || `Unit #${this.adminUnitId}`;
    //     if (u?.country?.country_name || u?.entity?.entity_name) {
    //       this.adminUnitMeta = [u?.country?.country_name, u?.entity?.entity_name].filter(Boolean).join(' / ');
    //     }
    //   },
    //   error: () => { /* optional: silent */ }
    // });

    // 3) Load employees list
    // this.loadEmployees();
  }

  // ---- employees ----
  private loadEmployees() {
    this.loadingEmployees = true;
    this.userService.getUsers().pipe(
      finalize(() => {
        this.loadingEmployees = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (data: any) => {
        this.employees = data;
        this.filteredEmployees = [...this.employees];
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.message = 'Failed to load employees.';
      }
    });
  }

  filterEmployees() {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredEmployees = this.employees.filter(emp =>
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.position || '').toLowerCase().includes(q)
    );
  }

  // ---- selections ----
  selectEmployee(emp: Employee) {
    this.form.get('id')?.setValue(emp.id);
  }
  isSelected(empId: number): boolean {
    return this.form.get('id')?.value === empId;
  }

  selectRole(roleKey: 'unit_admin' | 'standard') {
    this.form.get('role')?.setValue(roleKey);
  }
  
  isRoleSelected(roleKey: string): boolean {
    return this.form.get('role')?.value === roleKey;
  }

  get selectedEmployee() {
    const id = this.form.get('id')?.value;
    return this.employees.find(e => e.id === id);
  }
  clearErrors() { this.serverErrors = []; this.fieldErrors = {}; }
  hasFieldError(k: string) { return !!this.fieldErrors[k]?.length; }
  firstFieldError(k: string) { return this.fieldErrors[k]?.[0] || null; }
  
  private parseApiError(err: any) {
    const general: string[] = [];
    const field: Record<string,string[]> = {};
    const payload = err instanceof HttpErrorResponse ? err.error : err;
  
    if (payload && typeof payload === 'object') {
      if (typeof payload.error === 'string') general.push(payload.error);
      if (typeof payload.message === 'string' && payload.message.trim() && payload.message !== 'The given data was invalid.') {
        general.push(payload.message);
      }
      if (payload.errors && typeof payload.errors === 'object') {
        Object.keys(payload.errors).forEach(k => {
          const arr = Array.isArray(payload.errors[k]) ? payload.errors[k] : [String(payload.errors[k])];
          field[k] = arr;
        });
      }
    } else if (typeof payload === 'string') {
      general.push(payload);
    } else {
      general.push('An unexpected error occurred. Please try again.');
    }
  
    if (!general.length && err instanceof HttpErrorResponse) {
      if (err.status === 0) general.push('Network error. Check your connection.');
      else general.push(`Request failed (${err.status}).`);
    }
  
    return { general, field };
  }
  
  onSubmit() {
    if (this.fatalBlocker) return;
    this.clearErrors();
  
    if (this.form.invalid) {
      this.serverErrors = ['Please select an employee and a role.'];
      return;
    }
  
    // defense-in-depth: lock to admin’s unit
    this.form.patchValue({ unit_id: this.adminUnitId });
  
    this.submitting = true;
  
    this.userService.createUser(this.form.value).pipe(
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();   // <— IMPORTANT with OnPush
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        const { general, field } = this.parseApiError(err);
        this.serverErrors = general;
        this.fieldErrors = field;
  
        // Map your 409 to the Employee field too
        if (err.status === 409 && err.error?.error) {
          this.fieldErrors['id'] = [...(this.fieldErrors['id'] || []), err.error.error];
          this.form.get('id')?.setErrors({ server: true });
        }
  
        // Mark all server-error controls invalid (to trigger red styles if you use them)
        Object.keys(this.fieldErrors).forEach(ctrl => {
          this.form.get(ctrl)?.setErrors({ server: true });
        });
      }
    });
  }
}
