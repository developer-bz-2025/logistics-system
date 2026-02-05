import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService, Notification } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserService } from 'src/app/core/services/user.service';
import { JwtService } from 'src/app/core/services/jwt.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  notifications: Notification[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  page = 1;
  perPage = 15;
  total = 0;
  lastPage = 1;

  // Filters
  filterRead: 'all' | 'unread' | 'read' = 'all';

  user: any = null;
  isPrAdmin = false;

  constructor(
    private notificationService: NotificationService,
    private toast: ToastService,
    private router: Router,
    private userService: UserService,
    private jwtService: JwtService
  ) {
    console.log('NotificationsComponent constructor called');
  }

  ngOnInit(): void {
    console.log('NotificationsComponent ngOnInit');
    this.loadUser();
    this.loadNotifications();
  }

  loadUser(): void {
    const userId = this.jwtService.getUserId();
    if (userId) {
      this.userService.getUser(Number(userId)).subscribe({
        next: (data) => {
          this.user = data;
          this.isPrAdmin = this.user?.role?.name === 'pr_admin';
        },
        error: (err) => {
          console.error('Failed to fetch user data', err);
        }
      });
    }
  }

  navigateToPrHome(): void {
    this.router.navigate(['/pr/list']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = null;

    const options: any = {
      page: this.page,
      per_page: this.perPage
    };

    if (this.filterRead === 'unread') {
      options.is_read = false;
    } else if (this.filterRead === 'read') {
      options.is_read = true;
    }

    this.notificationService.getNotifications(options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notifications = response.data || [];
          this.total = response.total || 0;
          this.lastPage = response.last_page || 1;
          this.loading = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load notifications';
          this.loading = false;
          this.toast.error(this.error || 'Failed to load notifications');
        }
      });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadNotifications();
  }

  setFilterAll(): void {
    this.filterRead = 'all';
    this.onFilterChange();
  }

  setFilterUnread(): void {
    this.filterRead = 'unread';
    this.onFilterChange();
  }

  setFilterRead(): void {
    this.filterRead = 'read';
    this.onFilterChange();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  onPageChange(newPage: number): void {
    if (newPage < 1 || newPage > this.lastPage) return;
    this.page = newPage;
    this.loadNotifications();
  }

  markAsRead(notification: Notification): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
          this.toast.success('Notification marked as read');
          this.loadNotifications(); // Reload to update counts
        },
        error: (error) => {
          this.toast.error(error?.error?.message || 'Failed to mark notification as read');
        }
      });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toast.success(`${response.count} notifications marked as read`);
          this.loadNotifications();
        },
        error: (error) => {
          this.toast.error(error?.error?.message || 'Failed to mark all as read');
        }
      });
  }

  deleteNotification(notification: Notification): void {
    if (!confirm(`Delete notification "${notification.title}"?`)) {
      return;
    }

    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Notification deleted');
          this.loadNotifications();
        },
        error: (error) => {
          this.toast.error(error?.error?.message || 'Failed to delete notification');
        }
      });
  }

  viewNotification(notification: Notification): void {
    // Mark as read when viewed
    if (!notification.is_read) {
      this.markAsRead(notification);
    }
    // You can add navigation to specific pages based on notification type here
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
