import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PortalService } from '../services/portal.service';

@Injectable({ providedIn: 'root' })
export class PortalGuard implements CanActivate, CanActivateChild {
  constructor(
    private auth: AuthService,
    private router: Router,
    private portal: PortalService
  ) {}

  canActivate(): boolean | UrlTree {
    return this.checkPortalAuth();
  }

  canActivateChild(_route: unknown, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.portal.isDonorsPortal()) {
      return true;
    }

    const path = state.url.split('?')[0];
    if (!this.portal.isRouteAllowed(path)) {
      return this.router.createUrlTree(['/finance']);
    }

    return true;
  }

  private checkPortalAuth(): boolean | UrlTree {
    if (!this.portal.isDonorsPortal()) {
      return true;
    }

    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/authentication/login']);
    }

    if (!this.auth.hasAnyRole(['finance'])) {
      this.auth.logout();
      return this.router.createUrlTree(['/authentication/login'], {
        queryParams: { portal: 'finance-only' },
      });
    }

    return true;
  }
}
