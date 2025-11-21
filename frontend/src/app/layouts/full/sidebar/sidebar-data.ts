import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/dashboard',
    roles: ['super_admin','log_admin']
  },

  {
    navCap: 'Managment',
    roles: ['super_admin']
  },
  {
    displayName: 'PR Edit Requests',
    iconName: 'layout-dashboard',
    route: '/dashboard/pr-edit-requests',
    roles: ['super_admin']
  },
  {
    displayName: 'Assign Location Admins',
    iconName: 'users',
    route: '/dashboard/pr-edit-requests/log-admin-assignments',
    roles: ['super_admin']
  },

  { navCap: 'Assets' },
  { displayName: 'All Assets', iconName: 'package', route: '/assets', roles: ['super_admin','log_admin'] },
  { displayName: 'My Assets', iconName: 'clipboard', route: '/dashboard/my-assets', roles: ['log_admin'] },

  { displayName: 'Categories', iconName: 'users', expandable: true, expanded: true, roles: ['super_admin','log_admin'], children: [] },

];
