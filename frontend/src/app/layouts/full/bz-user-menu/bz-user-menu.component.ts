import { Component, Input } from '@angular/core';
import { MenuPositionX, MenuPositionY } from '@angular/material/menu';

/**
 * BZ design: the user chip and its profile popup (email, role, locations, change password,
 * logout), the BZ counterpart of the classic header's profile menu.
 */
@Component({
  selector: 'app-bz-user-menu',
  template: `
    <button type="button" class="bz-user-chip bz-user-chip--button" [class.is-compact]="compact"
            [matMenuTriggerFor]="profileMenu" [attr.aria-label]="'Account menu for ' + (user?.name || 'user')">
      <span class="bz-user-chip__avatar">{{ initial }}</span>
      <span class="bz-user-chip__text">
        <span class="bz-user-chip__name">{{ user?.name }}</span>
        <span class="bz-user-chip__meta" *ngIf="user?.email">{{ user.email }}</span>
      </span>
      <i-tabler class="bz-user-chip__chevron" [name]="yPosition === 'above' ? 'chevron-up' : 'chevron-down'"></i-tabler>
    </button>

    <mat-menu #profileMenu="matMenu" class="bz-user-menu" [xPosition]="xPosition" [yPosition]="yPosition">
      <div class="bz-user-menu__head" (click)="$event.stopPropagation()">
        <div class="bz-user-menu__identity">
          <span class="bz-user-menu__avatar">{{ initial }}</span>
          <div class="bz-user-menu__who">
            <div class="bz-user-menu__name">{{ user?.name }}</div>
            <div class="bz-user-menu__email">{{ user?.email }}</div>
          </div>
        </div>
        <span class="bz-user-menu__role" *ngIf="roleLabel">{{ roleLabel }}</span>

        <div class="bz-user-menu__locations" *ngIf="roleName === 'log_admin'">
          <div class="bz-user-menu__section">Locations</div>
          <div class="bz-user-menu__chips">
            <span class="bz-user-menu__chip" *ngFor="let location of user?.locations">{{ location.name }}</span>
            <span class="bz-user-menu__empty" *ngIf="!user?.locations?.length">No locations assigned</span>
          </div>
        </div>
      </div>

      <div class="bz-user-menu__actions">
        <a mat-menu-item [routerLink]="['/authentication/change-password']">
          <i-tabler name="key" class="bz-user-menu__icon" matMenuItemIcon></i-tabler>
          <span>Change Password</span>
        </a>
        <a mat-menu-item [routerLink]="['/authentication/login']">
          <i-tabler name="logout" class="bz-user-menu__icon" matMenuItemIcon></i-tabler>
          <span>Logout</span>
        </a>
      </div>
    </mat-menu>
  `,
})
export class BzUserMenuComponent {
  /** The /users/{id} record: name, email, role { name }, locations [{ name }]. */
  @Input() user: any;
  /** Avatar and chevron only (top bar on small screens). */
  @Input() compact = false;
  @Input() xPosition: MenuPositionX = 'after';
  @Input() yPosition: MenuPositionY = 'above';

  get initial(): string {
    return (this.user?.name || '?').charAt(0).toUpperCase();
  }

  get roleName(): string {
    const role = this.user?.role;
    return (typeof role === 'string' ? role : role?.name) || '';
  }

  // Same wording as the classic profile menu
  get roleLabel(): string {
    const name = this.roleName;
    if (!name) return '';
    if (name === 'super_admin') return 'Pro Admin';
    return name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
