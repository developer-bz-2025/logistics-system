import { NavItem } from './nav-item/nav-item';

/** Sidebar items shown on donors.bzassets.org (finance portal). */
export const portalNavItems: NavItem[] = [
  {
    navCap: 'Donors Portal',
  },
  {
    displayName: 'Donors',
    iconName: 'account_balance',
    route: '/finance',
    roles: ['finance'],
  },
  {
    navCap: 'Logistic',
    roles: ['finance'],
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/dashboard',
    roles: ['finance'],
  },
  {
    displayName: 'All Assets',
    iconName: 'package',
    route: '/assets',
    roles: ['finance'],
  },
  {
    displayName: 'Categories',
    iconName: 'category',
    expandable: true,
    expanded: false,
    roles: ['finance'],
    children: [],
  },
];
