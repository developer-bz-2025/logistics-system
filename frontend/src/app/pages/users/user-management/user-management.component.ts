import { Component } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  unit: string;
  country: string;
  entity: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent {

  users: User[] = []; // fetched from API
  filteredUsers: User[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  loading = true;

  // filters
  searchText = '';
  selectedRole = 'All Roles';
  selectedCountry = 'All Countries';
  selectedEntity = 'All Entities';
  selectedStatus = 'All Status';
  roles: any = [];
  countries: any = [];
  entities: any = [];
  statuses: any = [];
  units: any = [];
  userRole:any;


  constructor(private userService: UserService, private router: Router, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadUsers();

    this.userService.getUserRole().subscribe(role => {
      if (role) {
        console.log('User role is:', role);
        this.userRole=role;
        // do role-based logic here
      } else {
        console.warn('User role not found');
      }
    });
  }

  generateFiltersFromUsers(users: any[]) {
    const roleSet = new Set<string>();
    const countrySet = new Set<string>();
    const entitySet = new Set<string>();

    for (const user of users) {
      if (user.role) roleSet.add(user.role);
      if (user.country) countrySet.add(user.country);
      if (user.entity) entitySet.add(user.entity);
    }

    this.roles = ['All Roles', ...Array.from(roleSet)];
    this.countries = ['All Countries', ...Array.from(countrySet)];
    this.entities = ['All Entities', ...Array.from(entitySet)];
  }

  

  loadUsers(): void {
    this.loading = true;
    this.userService.getAssignedUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.filteredUsers = users;
        this.generateFiltersFromUsers(this.users);
        this.applyFilters();
        console.log("users",this.users);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Failed to create country:', err)
      }
    });
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      console.log(user);
      console.log(this.selectedRole);
      return (
        (this.selectedRole === 'All Roles' || user.role === this.selectedRole) &&
        (this.selectedCountry === 'All Countries' || user.country === this.selectedCountry) &&
        (this.selectedEntity === 'All Entities' || user.entity === this.selectedEntity) &&
        (this.selectedStatus === 'All Status' || user.status === this.selectedStatus) &&
        (user.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(this.searchText.toLowerCase()))
      );
    });
    this.currentPage = 1;
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  pageCount(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  pages(): number[] {
    return Array.from({ length: this.pageCount() }, (_, i) => i + 1);
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  roleGradientMap: { [key: string]: string } = {
    super_admin: 'from-[#E6DADA] to-[#274046]',        // Gray
    country_dir: 'from-[#72C6EF] to-[#004E8F]',    // Cyan to Teal bg-gradient-to-br from-[#72C6EF] to-[#004E8F]
    head_of_entity: 'from-[#00416A] to-[#E4E5E6]',      // Orange bg-gradient-to-br from-[#00416A] to-[#E4E5E6]
    unit_admin: 'from-[#215F00] to-[#E4E4D9]',          // Blue bg-gradient-to-br from-[#215F00] to-[#E4E4D9]
    standard: 'from-[#FCE38A] to-[#F38181]',            // Yellow to Red
    board: 'from-[#F2709C] to-[#FF9400]',             // Purple gradient bg-gradient-to-br from-[#F2709C] to-[#FF9472]
    default: 'from-[#D3CCE3] to-[#E9E4F0]'              // Light fallback
  };

  getGradientClass(role: string): string {
    return this.roleGradientMap[role] || this.roleGradientMap['default'];
  }

  

  deleteUser(user: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User Assignment',
        message: `Are you sure you want to remove ${user.name}'s assignment?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(user.user_id).subscribe({
          next: () => {
            this.loadUsers();
            console.log('User assignment deleted successfully');
            // Optionally refresh your list or show success toast
          },
          error: (err) => {
            console.error('Error deleting user assignment:', err);
            // Optionally show error toast
          }
        });
      }
    });

  }


}
