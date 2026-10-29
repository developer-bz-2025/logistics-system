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
import { NavigationEnd, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PortalService } from 'src/app/core/services/portal.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { environment } from 'src/environments/environment';

// BZ top bar title: longest matching path prefix wins.
const PAGE_TITLES: Array<[string, string]> = [
  ['/dashboard/pr-edit-requests/log-admin-assignments', 'Assign Location Admins'],
  ['/dashboard/pr-edit-requests', 'PR Edit Requests'],
  ['/dashboard/item-edit-requests', 'Asset Edit Requests'],
  ['/dashboard/my-assets/location-change-requests', 'Location Change Requests'],
  ['/dashboard/my-assets', 'My Assets'],
  ['/dashboard/references', 'References'],
  ['/dashboard', 'Dashboard'],
  ['/assets/new', 'New Asset'],
  ['/assets/', 'Asset Details'],
  ['/assets', 'Assets'],
  ['/pr/create', 'New Purchase Request'],
  ['/pr/list', 'Purchase Requests'],
  ['/pr/', 'Purchase Request'],
  ['/finance/', 'Donor Details'],
  ['/finance', 'Donors'],
  ['/notifications', 'Notifications'],
  ['/search', 'Search'],
];

// import jwt_decode from 'jwt-decode';
// import {jwtDecode} from 'jwt-decode';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showToggle = true;
  /** False when the layout renders no sidebar (e.g. PR admin). */
  @Input() hasSidebar = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  showFiller = false;
  user: any = null;
  unreadCount = 0;
  isBzTheme = false;
  headerLogo: string | null = null;
  readonly appTitle = environment.appTitle;
  pageTitle = 'Dashboard';

  q = new FormControl('');

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    public portal: PortalService,
    public theme: ThemeService
  ) { }

  get showBackToDonors(): boolean {
    return this.portal.isDonorsPortal()
      && (this.router.url.startsWith('/assets') || this.router.url.startsWith('/dashboard'));
  }

  backToDonors(): void {
    this.router.navigateByUrl('/finance');
  }


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
    this.theme.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.isBzTheme = mode === 'bz';
        this.headerLogo = this.theme.logos.header;
      });

    this.updatePageTitle(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => this.updatePageTitle(e.urlAfterRedirects));

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

  private updatePageTitle(url: string): void {
    const path = (url || '/').split('?')[0];
    const match = PAGE_TITLES.find(([prefix]) => path === prefix || path.startsWith(prefix));
    this.pageTitle = match ? match[1] : 'Dashboard';
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
    log_admin: 'from-[#c8afb1] to-[#6f1921]',    // B&Z blush → burgundy
    pr_admin: 'from-[#00416A] to-[#E4E5E6]',      // Orange bg-gradient-to-br from-[#00416A] to-[#E4E5E6]
    unit_admin: 'from-[#215F00] to-[#E4E4D9]',          // Blue bg-gradient-to-br from-[#215F00] to-[#E4E4D9]
    finance: 'from-[#4C1D95] to-[#22C55E]',             // Purple to Green for finance
    standard: 'from-[#FCE38A] to-[#F38181]',            // Yellow to Red
    c_level: 'from-[#F2709C] to-[#FF9400]',             // Purple gradient bg-gradient-to-br from-[#F2709C] to-[#FF9472]
    default: 'from-[#D3CCE3] to-[#E9E4F0]'              // Light fallback
  };

  getGradientClass(role: string): string {
    const gradient = this.roleGradientMap[role] || this.roleGradientMap['default'];
    return `bg-gradient-to-br ${gradient}`;
  }
}
