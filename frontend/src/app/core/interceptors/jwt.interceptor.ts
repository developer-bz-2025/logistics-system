import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private jwt: JwtService, private router: Router) {}

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
          console.warn('[AuthInterceptor] 401 received, clearing token and redirecting to login');
          this.jwt.clearToken();
          this.router.navigate(['/authentication/login']);
        }
        return throwError(() => err);
      })
    );
  }
}
