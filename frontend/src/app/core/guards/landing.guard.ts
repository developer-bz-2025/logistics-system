import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';


@Injectable({ providedIn: 'root' })
export class LandingGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<UrlTree> | UrlTree {
    // not logged in → login
    if (!this.auth.isAuthenticated()) {
      return this.router.createUrlTree(['/authentication/login']);
    }
    // ensure roles/user are loaded (you already have this)
    return this.auth.ensureUserLoaded().pipe(
      map(() => {
        if (this.auth.hasAnyRole(['super_admin', 'c_level'])) {
          return this.router.createUrlTree(['/pages/dashboard']);
        }
        if (this.auth.hasAnyRole(['unit_admin'])) {
          return this.router.createUrlTree(['/unit-admin']);
        }
        if (this.auth.hasAnyRole(['standard'])) {
          return this.router.createUrlTree(['/unit-admin/my-unit-resources']);
        }
        return this.router.createUrlTree(['/workspace/browse-resource']);
      })
    );
  }
}