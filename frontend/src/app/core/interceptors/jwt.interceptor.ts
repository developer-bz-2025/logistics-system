// import { Injectable } from '@angular/core';
// import { AuthService } from '../services/auth.service';
// import {
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
//   HttpErrorResponse,
//   HttpInterceptor
// } from '@angular/common/http';

// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { Router } from '@angular/router';


// @Injectable()
// export class JwtInterceptor implements HttpInterceptor {
//   constructor(private auth: AuthService, private router: Router) {}

//   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     const token = this.auth.getToken();

//     if (token) {
//       req = req.clone({
//         setHeaders: {
//           Authorization: `Bearer ${token}`
//         }
//       });
//     }

//     return next.handle(req).pipe(
//       catchError((err: HttpErrorResponse) => {
//         // ✅ Token expired or invalid
//         if (err.status === 401 || err.status === 403) {
//           this.auth.logout();             // clear token
//           this.router.navigate(['/authentication/login']);      // redirect to login
//         }

//         return throwError(() => err);
//       })
//     );
//   }
// }

// src/app/core/interceptors/auth.interceptor.ts
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
