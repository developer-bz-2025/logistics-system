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
    const isAuthRequest = req.url.includes('/login') || req.url.includes('/refresh');

    if (token && !this.jwt.isTokenExpired() && !isAuthRequest) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401 || isAuthRequest) {
          return throwError(() => err);
        }

        if (this.isRefreshing) {
          return this.refreshTokenSubject.pipe(
            filter(refreshedToken => refreshedToken != null),
            take(1),
            switchMap(() => {
              const newToken = this.jwt.getToken();
              const newReq = newToken && !this.jwt.isTokenExpired()
                ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                : req;
              return next.handle(newReq);
            })
          );
        }

        this.isRefreshing = true;
        this.refreshTokenSubject.next(null);

        const refreshToken = this.jwt.getRefreshToken();
        if (!refreshToken) {
          this.isRefreshing = false;
          this.handleAuthError();
          return throwError(() => err);
        }

        return this.auth.refreshToken().pipe(
          switchMap((response) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.access_token);

            const newToken = this.jwt.getToken();
            const newReq = newToken
              ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
              : req;
            return next.handle(newReq);
          }),
          catchError((refreshError) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null);
            this.handleAuthError();
            return throwError(() => refreshError);
          })
        );
      })
    );
  }

  private handleAuthError(): void {
    this.auth.logout();

    const onLoginPage = this.router.url.startsWith('/authentication/login');
    if (!onLoginPage) {
      this.router.navigate(['/authentication/login']);
    }
  }
}
