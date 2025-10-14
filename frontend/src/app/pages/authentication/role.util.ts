// role.util.ts
export type RoleName = 'super_admin' | 'pr_admin' | 'log_admin';

export function extractRoles(user: any): RoleName[] {
  if (!user) return [];
  // backend might send: role: { name }, or role: 'super_admin', or roles: ['...']
  const direct = user.roles ?? user.role;

  if (Array.isArray(direct)) {
    return direct.map((r: any) => String(r?.name ?? r).toLowerCase()) as RoleName[];
  }

  if (direct && typeof direct === 'object') {
    return [String(direct.name).toLowerCase() as RoleName];
  }

  if (typeof direct === 'string') {
    return [direct.toLowerCase() as RoleName];
  }

  // fallback to role_id mapping (if needed)
  if (user.role_id) {
    const map: Record<number, RoleName> = { 1: 'pr_admin', 2: 'log_admin', 3: 'super_admin' };
    return [map[user.role_id] ?? ('' as RoleName)].filter(Boolean) as RoleName[];
  }

  return [];
}
