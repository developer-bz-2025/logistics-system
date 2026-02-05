import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/core/services/user.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// import jwt_decode from 'jwt-decode';
// import {jwtDecode} from 'jwt-decode';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  showFiller = false;
  user: any = null;
  unreadCount = 0;

  q = new FormControl('');

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location
  ) { }


  get isEmpty(): boolean {
    return !((this.q.value ?? '').toString().trim());
  }
  submit(term?: string) {
    const value = (term ?? this.q.value ?? '').toString().trim();
    if (!value) {
      // If we are on the results page and user cleared, go back
      if (this.router.url.startsWith('/search')) {
        this.safeBack();
      }
      return;
    }
    this.router.navigate(['/search'], { queryParams: { q: value } });
  }

  onInput() {
    // When input is cleared while on results page, go back
    if (this.isEmpty && this.router.url.startsWith('/search')) {
      this.safeBack();
    }
  }


  clear() {
    this.q.setValue('');
    if (this.router.url.startsWith('/search')) {
      this.safeBack();
    }
  }


  private safeBack() {
    // Basic back; optionally add a fallback route if this is the first page
    this.location.back();
    // If you want a hard fallback, uncomment below:
    // setTimeout(() => { if (this.router.url.startsWith('/search')) this.router.navigate(['/']); }, 0);
  }

  ngOnInit(): void {
    // console.log(this.jwtService.decodeToken())
    const userId = this.jwtService.getUserId();
    console.log(userId)
    if (userId) {
      this.userService.getUser(Number(userId)).subscribe({
        next: (data) => {
          console.log(data)
          this.user = data;
        },
        error: (err) => {
          console.error('Failed to fetch user data', err);
        }
      });
    }

    // Load unread count
    this.loadUnreadCount();

    // Refresh unread count every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUnreadCount();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          this.unreadCount = count;
        },
        error: (error) => {
          console.error('Failed to load unread count', error);
        }
      });
  }

  navigateToNotifications(): void {
    console.log('Navigating to /notifications');
    this.router.navigate(['/notifications']).then(
      (success) => console.log('Navigation success:', success),
      (error) => console.error('Navigation error:', error)
    );
  }

  roleGradientMap: { [key: string]: string } = {
    super_admin: 'from-[#F2709C] to-[#FF9400]',
    log_admin: 'from-[#72C6EF] to-[#0D9488]',    // Cyan to Teal bg-gradient-to-br from-[#72C6EF] to-[#004E8F]
    pr_admin: 'from-[#00416A] to-[#E4E5E6]',      // Orange bg-gradient-to-br from-[#00416A] to-[#E4E5E6]
    unit_admin: 'from-[#215F00] to-[#E4E4D9]',          // Blue bg-gradient-to-br from-[#215F00] to-[#E4E4D9]
    standard: 'from-[#FCE38A] to-[#F38181]',            // Yellow to Red
    c_level: 'from-[#F2709C] to-[#FF9400]',             // Purple gradient bg-gradient-to-br from-[#F2709C] to-[#FF9472]
    default: 'from-[#D3CCE3] to-[#E9E4F0]'              // Light fallback
  };

  getGradientClass(role: string): string {
    const gradient = this.roleGradientMap[role] || this.roleGradientMap['default'];
    return `bg-gradient-to-br ${gradient}`;
  }
}
