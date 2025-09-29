import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, switchMap } from 'rxjs';
import { UserService, UnitUserLite, Paginated } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unit-user',
  templateUrl: './unit-user.component.html',
  styleUrls: ['./unit-user.component.scss']
})
export class UnitUserComponent {

  rows: UnitUserLite[] = [];
  total = 0;
  loading = false;
  unitId?: number;


  search$ = new BehaviorSubject<string>('');
  page$ = new BehaviorSubject<number>(1);
  size$ = new BehaviorSubject<number>(10);


  constructor(private users: UserService, private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    const u = this.auth.user();
    this.unitId = u?.unit_id;

    combineLatest([this.search$, this.page$, this.size$])
      .pipe(
        switchMap(([search, page, per_page]) => {
          this.loading = true;
          return this.users.getUnitUsers(this.unitId, { search, page, per_page });
        })
      )
      .subscribe({
        next: (res) => {
          this.rows = res.data;
          this.total = res.total ?? 0;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }
  
  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  onSearch(q: string) { this.search$.next(q); this.page$.next(1); }
  onPrev() { this.page$.next(Math.max(1, this.page$.value - 1)); }
  onNext() { this.page$.next(this.page$.value + 1); }

  roleGradientMap: { [key: string]: string } = {
    super_admin: 'from-[#E6DADA] to-[#274046]',        // Gray
    country_dir: 'from-[#72C6EF] to-[#004E8F]',    // Cyan to Teal bg-gradient-to-br from-[#72C6EF] to-[#004E8F]
    head_of_entity: 'from-[#00416A] to-[#E4E5E6]',      // Orange bg-gradient-to-br from-[#00416A] to-[#E4E5E6]
    unit_admin: 'from-[#215F00] to-[#E4E4D9]',          // Blue bg-gradient-to-br from-[#215F00] to-[#E4E4D9]
    standard: 'from-[#E6DADA] to-[#274046]',            // Yellow to Red
    default: 'from-[#D3CCE3] to-[#E9E4F0]'              // Light fallback
  };

  getGradientClass(role: string): string {
    return this.roleGradientMap[role] || this.roleGradientMap['default'];
  }

}
