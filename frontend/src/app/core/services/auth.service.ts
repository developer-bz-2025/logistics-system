import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { JwtService } from './jwt.service';

export interface AppUser {
  id: number;
  email: string;
  role: string[];
}

@Injectable({ providedIn: 'root' })


export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}`;
  private _user$ = new BehaviorSubject<AppUser | null>(null);
  user$ = this._user$.asObservable();


  constructor(private http: HttpClient, private jwt: JwtService) {
   
  }

  // login(data: { email: string; password: string }): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/login`, data);
  // }

  login(data: { email: string; password: string }) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, data);
  }

  // Save token and hydrate user from backend
  initializeFromToken(token: string): Observable<AppUser | null> {
    console.log('[AuthService] initializeFromToken token len:', token?.length ?? 0);
    this.jwt.setToken(token);
    return this.loadUserFromApi();
  }

  ensureUserLoaded(): Observable<boolean> {
    console.log('[AuthService] ensureUserLoaded, isLoggedIn=', this.isLoggedIn(), 'have user=', !!this._user$.value);
    if (!this.isLoggedIn()) return of(false);
    if (this._user$.value) return of(true);
    return this.loadUserFromApi().pipe(map(u => !!u));
  }

  private loadUserFromApi(): Observable<AppUser | null> {
    const id = this.jwt.getUserId();
    console.log('[AuthService] loadUserFromApi, userId from token =', id);
    if (!id) return of(null);
    // use /me if you have it: `${this.apiUrl}/me`
    return this.http.get<AppUser>(`${this.apiUrl}/users/${id}`).pipe(
      tap(u => { console.log('[AuthService] user loaded from API:', u); this._user$.next(u); }),
      catchError(() => { this._user$.next(null); return of(null); }),
      shareReplay(1)
    );
  }

  // ---- compatibility + helpers
  saveToken(t: string) { this.jwt.setToken(t); }
  getToken() { return this.jwt.getToken(); }
  logout() { this.jwt.clearToken(); this._user$.next(null); }
  isAuthenticated() { return !!this.getToken(); }
  isLoggedIn() { return !!this.getToken() && !this.jwt.isTokenExpired(); }

  user() { return this._user$.value; }
  
  // auth.service.ts

private extractRole(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    // common shapes: { name: 'pr_admin' } | { code: 'PR_ADMIN' } | { slug: 'pr_admin' }
    if (typeof val.name === 'string') return val.name;
    if (typeof val.code === 'string') return val.code;
    if (typeof val.slug === 'string') return val.slug;
    // sometimes role is nested: { role: { name: 'pr_admin' } }
    if (val.role && typeof val.role === 'object') return this.extractRole(val.role);
  }
  return null;
}

hasAnyRole(roles: string[]) {
  if (!roles?.length) return true;

  console.log(roles)

  const payload: any = this.jwt.getPayload<any>();
  // Accept a lot of shapes: user.roles[], user.role, payload.roles, payload.role
  const raw =
    this._user$.value?.role ??
    this._user$.value?.role ??
    payload?.roles ??
    payload?.role ??
    [];

  const arr = Array.isArray(raw) ? raw : [raw];

  const normalizedUserRoles = arr
    .map(r => this.extractRole(r))
    .filter((r): r is string => !!r)
    .map(r => r.toLowerCase());

  const normalizedRequired = roles.map(r => String(r).toLowerCase());

  console.log('[AuthService] hasAnyRole? userRoles=', normalizedUserRoles, 'required=', normalizedRequired);

  return normalizedRequired.some(r => normalizedUserRoles.includes(r));
}

  // hasAnyRole(roles: string[]) {
  //   if (!roles?.length) return true;
  //   const payload: any = this.jwt.getPayload<any>();
  //   const userRolesRaw = this._user$.value?.role ?? (this._user$.value as any)?.role ?? (payload?.roles ?? payload?.role ?? []);
  //   const userRoles: string[] = Array.isArray(userRolesRaw) ? userRolesRaw : (userRolesRaw ? [userRolesRaw] : []);
  //   const normalizedUserRoles = userRoles.map(r => String(r).toLowerCase());
  //   const normalizedRequired = roles.map(r => String(r).toLowerCase());
  //   console.log('[AuthService] hasAnyRole? userRoles=', normalizedUserRoles, 'required=', normalizedRequired);
  //   return normalizedRequired.some(r => normalizedUserRoles.includes(r));
  // }
  primaryRole() { return this._user$.value?.role?.[0] ?? null; }

}
