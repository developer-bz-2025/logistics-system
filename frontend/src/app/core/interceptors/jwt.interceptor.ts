import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { JwtService } from '../services/jwt.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private jwt: JwtService,
    private auth: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.jwt.getToken();
    if (token) {
      console.log('[AuthInterceptor] attaching token');
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    } else {
      console.log('[AuthInterceptor] no token to attach');
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.warn('[AuthInterceptor] 401 received, attempting token refresh');

          // If already refreshing, wait for the refresh to complete
          if (this.isRefreshing) {
            return this.refreshTokenSubject.pipe(
              filter(token => token != null),
              take(1),
              switchMap(() => {
                const newToken = this.jwt.getToken();
                const newReq = newToken
                  ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                  : req;
                return next.handle(newReq);
              })
            );
          }

          // Start refresh process
          this.isRefreshing = true;
          this.refreshTokenSubject.next(null);

          // Check if we have a refresh token
          const refreshToken = this.jwt.getRefreshToken();
          if (!refreshToken) {
            console.warn('[AuthInterceptor] No refresh token available, redirecting to login');
            this.handleAuthError();
            return throwError(() => err);
          }

          // Attempt to refresh token
          return this.auth.refreshToken().pipe(
            switchMap((response) => {
              console.log('[AuthInterceptor] Token refresh successful, retrying request');
              this.isRefreshing = false;
              this.refreshTokenSubject.next(response.access_token);

              // Retry the original request with new token
              const newToken = this.jwt.getToken();
              const newReq = newToken
                ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                : req;
              return next.handle(newReq);
            }),
            catchError((refreshError) => {
              console.error('[AuthInterceptor] Token refresh failed, redirecting to login', refreshError);
              this.isRefreshing = false;
              this.refreshTokenSubject.next(null);
              this.handleAuthError();
              return throwError(() => err);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  private handleAuthError() {
    this.auth.logout();
    this.router.navigate(['/authentication/login']);
  }
}
