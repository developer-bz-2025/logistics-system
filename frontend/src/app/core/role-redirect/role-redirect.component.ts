// src/app/core/role-redirect/role-redirect.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({ selector: 'app-role-redirect', template: '' })
export class RoleRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) return this.router.navigateByUrl('/authentication/login');

    // order matters: super_admin > unit_admin > workspace viewers
    if (this.auth.hasAnyRole(['super_admin'])) return this.router.navigateByUrl('/pages/dashboard');
    if (this.auth.hasAnyRole(['c_level'])) return this.router.navigateByUrl('/pages/dashboard');
    if (this.auth.hasAnyRole(['unit_admin']))  return this.router.navigateByUrl('/unit-admin');

    // fall back to workspace for viewer roles
    return this.router.navigateByUrl('/workspace/browse-resource');
  }
}
