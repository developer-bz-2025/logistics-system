import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router,Route, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isAuth = this.auth.isAuthenticated();
    console.log('[Guard:canActivate] isAuthenticated =', isAuth);
    if (!isAuth) {
       console.log('[Guard:canActivate] redirect -> /authentication/login');
      this.router.navigate(['/authentication/login']);
      return false;
    }
    console.log('[Guard:canActivate] allow navigation');
    return true;
  }

  canMatch(route: Route, _segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const isLoggedIn = this.auth.isLoggedIn();
    const roles = (route.data?.['roles'] as string[]) ?? [];
    console.log('[Guard:canMatch] isLoggedIn =', isLoggedIn, 'required roles =', roles);
    if (!isLoggedIn) {
      console.log('[Guard:canMatch] not logged in -> /authentication/login');
      return of(this.router.createUrlTree(['/authentication/login']));
    }
    return this.auth.ensureUserLoaded().pipe(
      map(() => {
        const allowed = this.auth.hasAnyRole(roles);
        console.log('[Guard:canMatch] hasAnyRole =', allowed);
        return allowed ? true : this.router.createUrlTree(['/authentication/login']);
      })
    );
  }


}
