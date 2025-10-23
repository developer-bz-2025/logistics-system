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
        if (this.auth.hasAnyRole(['pr_admin'])) {
          return this.router.createUrlTree(['/pr']);
        }
        if (this.auth.hasAnyRole(['log_admin'])) {
          return this.router.createUrlTree(['/dashboard']);
        }
        
        return this.router.createUrlTree(['/dashboard']);
      })
    );
  }
}