import { Component } from '@angular/core';
// Optional: wire highlight using your existing AuthService
import { AuthService } from 'src/app/core/services/auth.service';

type RoleKey =
  | 'super_admin'
  | 'c_level'
  | 'country_dir'
  | 'head_of_entity'
  | 'unit_admin'
  | 'standard';

type VisKey = 'internal' | 'public' | 'global' | 'confidential';

interface Cell {
  allowed: boolean;
  scope?: string; // short human text
}

@Component({
  selector: 'app-role-permissions',
  templateUrl: './role-permissions.component.html'
})
export class RolePermissionsComponent {
  constructor(private auth: AuthService) {}

  // Legend
  visLegend: Array<{ key: VisKey; label: string; desc: string }> = [
    { key: 'internal',      label: 'Internal',     desc: 'Same unit only' },
    { key: 'public',        label: 'Public',       desc: 'Same entity (across units)' },
    { key: 'global',        label: 'Global',       desc: 'Everyone in system' },
    { key: 'confidential',  label: 'Confidential', desc: 'Uploader / privileged only; excluded from browse' }
  ];

  // Pretty role labels
  roleLabel: Record<RoleKey, string> = {
    super_admin:     'Super Admin',
    c_level:         'Board',
    country_dir:     'Country Director',
    head_of_entity:  'Head of Entity',
    unit_admin:      'Unit Admin',
    standard:        'Standard User'
  };

  // Access matrix (frontend display only; backend still enforces)
  // Scope shortcodes used in UI:
  // - 'all units' | 'all entities' | 'own entity' | 'own entity & country' | 'own unit' | '—'
  matrix: Record<RoleKey, Record<VisKey, Cell>> = {
    super_admin: {
      internal:     { allowed: true,  scope: 'all units' },
      public:       { allowed: true,  scope: 'all entities' },
      global:       { allowed: true,  scope: 'all entities/countries' },
      confidential: { allowed: false }
    },
    c_level: {
      internal:     { allowed: true,  scope: 'all units' },
      public:       { allowed: true,  scope: 'all entities' },
      global:       { allowed: true,  scope: 'all entities/countries' },
      confidential: { allowed: false }
    },
    country_dir: {
      internal:     { allowed: true,  scope: 'own entity & country' },
      public:       { allowed: true,  scope: 'own entity & country' },
      global:       { allowed: true,  scope: 'all entities/countries' },
      confidential: { allowed: false }
    },
    head_of_entity: {
      internal:     { allowed: true,  scope: 'own entity' },
      public:       { allowed: true,  scope: 'own entity' },
      global:       { allowed: true,  scope: 'all entities/countries' },
      confidential: { allowed: false }
    },
    unit_admin: {
      internal:     { allowed: true,  scope: 'own unit' },
      public:       { allowed: true,  scope: 'own entity' },
      global:       { allowed: true,  scope: 'all entities/countries' },
      confidential: { allowed: false }
    },
    standard: {
      internal:     { allowed: true,  scope: 'own unit' },
      public:       { allowed: true,  scope: 'own entity' },
      global:       { allowed: true,  scope: 'all entities/countries' },
      confidential: { allowed: false }
    }
  };

  rolesOrder: RoleKey[] = [
    'super_admin', 'c_level', 'country_dir', 'head_of_entity', 'unit_admin', 'standard'
  ];

  // Highlight helpers
  isCurrentRole(role: RoleKey): boolean {
    try {
      return !!this.auth?.hasAnyRole?.([role]);
    } catch {
      return false;
    }
  }

  // Visibility badge colors
  visColor(key: VisKey): string {
    switch (key) {
      case 'internal': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'public': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'global': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confidential': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Icon + color per cell
  cellIcon(c: Cell): string { return c.allowed ? 'check_circle' : 'cancel'; }
  cellIconClass(c: Cell): string { return c.allowed ? 'text-emerald-600' : 'text-rose-500'; }

  // “Your access” summary (first matching priority role)
  currentSummary():
  | { roleLabel: string; items: Array<{ key: VisKey; label: string; scope?: string }> }
  | null {
  const r = this.rolesOrder.find(k => this.isCurrentRole(k));
  if (!r) return null;

  const row = this.matrix[r];
  const keys: VisKey[] = ['internal', 'public', 'global', 'confidential'];

  const items = keys
    .filter(k => row[k].allowed)
    .map(k => ({ key: k, label: this.capitalize(k), scope: row[k].scope }));

  return { roleLabel: this.roleLabel[r], items };
}

  // currentSummary(): { roleLabel: string; items: Array<{label: string; scope?: string}> } | null {
  //   const r = this.rolesOrder.find(k => this.isCurrentRole(k));
  //   if (!r) return null;
  //   const row = this.matrix[r];
  //   const items = (['internal','public','global','confidential'] as VisKey[])
  //     .filter(k => row[k].allowed)
  //     .map(k => ({ label: this.capitalize(k), scope: row[k].scope }));
  //   return { roleLabel: this.roleLabel[r], items };
  // }

  private capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
}
