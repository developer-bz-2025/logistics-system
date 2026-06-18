import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly donorsHost = environment.donorsPortalHost ?? 'donors.bzassets.org';

  isDonorsPortal(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.location.hostname === this.donorsHost;
  }

  get portalTitle(): string {
    return environment.portalTitle ?? 'Donor Management';
  }

  /** Route prefixes allowed on the donors portal (finance users). */
  readonly allowedRoutePrefixes = ['/finance', '/assets', '/dashboard'];

  /** Route prefixes blocked on the donors portal even if parent is allowed. */
  readonly blockedRoutePrefixes = [
    '/pr',
    '/notifications',
    '/dashboard/pr-edit-requests',
    '/dashboard/references',
    '/dashboard/my-assets',
  ];

  isRouteAllowed(url: string): boolean {
    const path = url.split('?')[0].replace(/\/+$/, '') || '/';
    if (path === '/') {
      return true;
    }
    if (this.blockedRoutePrefixes.some(prefix => path.startsWith(prefix))) {
      return false;
    }
    return this.allowedRoutePrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
  }
}
