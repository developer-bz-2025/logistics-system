import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { JwtService } from './jwt.service';

export interface AppUser {
  id: number;
  email: string;
  roles: string[];
  unit_id?: number; entity_id?: number; country_id?: number;
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
  
  hasAnyRole(roles: string[]) {
    if (!roles?.length) return true;
    const payload: any = this.jwt.getPayload<any>();
    const userRolesRaw = this._user$.value?.roles ?? (this._user$.value as any)?.role ?? (payload?.roles ?? payload?.role ?? []);
    const userRoles: string[] = Array.isArray(userRolesRaw) ? userRolesRaw : (userRolesRaw ? [userRolesRaw] : []);
    const normalizedUserRoles = userRoles.map(r => String(r).toLowerCase());
    const normalizedRequired = roles.map(r => String(r).toLowerCase());
    console.log('[AuthService] hasAnyRole? userRoles=', normalizedUserRoles, 'required=', normalizedRequired);
    return normalizedRequired.some(r => normalizedUserRoles.includes(r));
  }
  primaryRole() { return this._user$.value?.roles?.[0] ?? null; }

  // setSession(token: string, user: Partial<AuthUser>) {
  //   this.saveToken(token);
  //   const finalUser: AuthUser = {
  //     roles: user.roles ?? [],
  //     id: user.id,
  //     email: user.email,
  //     unit_id: user.unit_id,
  //     entity_id: user.entity_id,
  //     country_id: user.country_id,
  //   };
  //   this._user = finalUser;
  //   localStorage.setItem(this.USER_KEY, JSON.stringify(finalUser));
  // }

  // saveToken(token: string) {
  //   localStorage.setItem('access_token', token);
  // }

  // getToken(): string | null {
  //   return localStorage.getItem('access_token');
  // }

  // logout() {
  //   localStorage.removeItem('access_token');
  //   localStorage.removeItem(this.USER_KEY);
  //   this._user = null;
  // }

  // isAuthenticated(): boolean {
  //   return !!this.getToken();
  // }

  //  // ---- User / Roles ----
  //  user(): AuthUser | null {
  //   return this._user;
  // }
  // hasRole(role: string): boolean {
  //   return !!this._user?.roles?.includes(role);
  // }
  // hasAnyRole(roles: string[]): boolean {
  //   if (!roles?.length) return true;
  //   const userRoles = this._user?.roles ?? [];
  //   return roles.some(r => userRoles.includes(r));
  // }
  // primaryRole(): string | null {
  //   return this._user?.roles?.[0] ?? null;
  // }

  // // ---- Persistence ----
  // private loadFromStorage() {
  //   const raw = localStorage.getItem(this.USER_KEY);
  //   if (raw) {
  //     try { this._user = JSON.parse(raw) as AuthUser; } catch { this._user = null; }
  //   }
  // }
}
