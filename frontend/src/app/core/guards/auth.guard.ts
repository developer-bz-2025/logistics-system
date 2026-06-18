import { Injectable } from '@angular/core';
import { CanActivate, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { PortalService } from '../services/portal.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private portal: PortalService
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/authentication/login']);
    }
    return true;
  }

  canMatch(route: Route, _segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const roles = (route.data?.['roles'] as string[]) ?? [];

    if (!this.auth.isLoggedIn()) {
      return of(this.router.createUrlTree(['/authentication/login']));
    }

    if (!roles.length || this.auth.hasAnyRole(roles)) {
      return of(true);
    }

    return this.auth.ensureUserLoaded().pipe(
      take(1),
      map(() => {
        if (this.auth.hasAnyRole(roles)) {
          return true;
        }

        if (this.portal.isDonorsPortal()) {
          this.auth.logout();
        }

        return this.router.createUrlTree(['/authentication/login'], {
          queryParams: this.portal.isDonorsPortal() ? { portal: 'finance-only' } : undefined,
        });
      })
    );
  }
}
