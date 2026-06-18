import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PortalService } from '../services/portal.service';

@Injectable({ providedIn: 'root' })
export class LandingGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private portal: PortalService
  ) {}

  canActivate(): UrlTree {
    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/authentication/login']);
    }

    if (this.portal.isDonorsPortal()) {
      if (!this.auth.hasAnyRole(['finance'])) {
        this.auth.logout();
        return this.router.createUrlTree(['/authentication/login'], {
          queryParams: { portal: 'finance-only' },
        });
      }
      return this.router.createUrlTree(['/finance']);
    }

    if (this.auth.hasAnyRole(['finance'])) {
      return this.router.createUrlTree(['/finance']);
    }
    if (this.auth.hasAnyRole(['pr_admin'])) {
      return this.router.createUrlTree(['/pr']);
    }
    if (this.auth.hasAnyRole(['super_admin'])) {
      return this.router.createUrlTree(['/dashboard']);
    }
    if (this.auth.hasAnyRole(['log_admin'])) {
      return this.router.createUrlTree(['/dashboard']);
    }

    return this.router.createUrlTree(['/dashboard']);
  }
}
