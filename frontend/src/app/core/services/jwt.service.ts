import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  private TOKEN_KEY = 'access_token';


  constructor() { }

  
  // getToken(): string | null {
  //   return localStorage.getItem('access_token'); // adjust if stored under different key
  // }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  setToken(token: string) { localStorage.setItem(this.TOKEN_KEY, token); }
  clearToken() { localStorage.removeItem(this.TOKEN_KEY); }

  private b64urlDecode(s: string) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4; if (pad) s += '='.repeat(4 - pad);
    return atob(s);
  }

  getPayload<T = any>(): T | null {
    const t = this.getToken(); if (!t) return null;
    const parts = t.split('.'); if (parts.length !== 3) return null;
    try { return JSON.parse(this.b64urlDecode(parts[1])) as T; } catch { return null; }
  }

  getUserId(): string | number | null {
    const p: any = this.getPayload(); return p?.sub ?? null;
  }

  isTokenExpired(): boolean {
    const p: any = this.getPayload(); if (!p?.exp) return false;
    return Math.floor(Date.now()/1000) >= p.exp;
  }


  // decodeToken(): any {
  //   const token = this.getToken();
  //   if (!token) return null;

  //   const payload = token.split('.')[1];
  //   const decodedPayload = atob(payload);
    
  //   return JSON.parse(decodedPayload);
  // }

  // getUserId(): number | null {
  //   const decoded = this.decodeToken();
  //   return decoded?.sub || null;
  // }
}
