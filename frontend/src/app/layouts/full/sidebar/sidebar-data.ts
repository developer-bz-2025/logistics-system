import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
    roles: ['super_admin','c_level']
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/pages/dashboard',
    roles: ['super_admin','c_level']
  },
  {
    navCap: 'Management',
    roles: ['super_admin','c_level']
  },
  {
    displayName: 'User Management',
    iconName: 'user',
    route: '/pages/users/user-management',
    roles: ['super_admin','c_level']
  },
  {
    displayName: 'Entity Management',
    iconName: 'database',
    route: '/pages/entities/entity-management',
    roles: ['super_admin','c_level']
  },

  // { navCap: 'Unit Admin', roles: ['unit_admin'] },
  {
    navCap: 'Home',
    roles: ['unit_admin']
  },
  { displayName: 'Unit Dashboard', iconName: 'layout-dashboard', route: '/unit-admin/dashboard', roles: ['unit_admin'] },
  {
    navCap: 'Management',
    roles: ['unit_admin']
  },
  {
    navCap: 'Browsing',
    roles: ['standard','head_of_entity','country_dir','c_level','super_admin']
  },

  { displayName: 'My Unit Resources', iconName: 'database', route: '/unit-admin/my-unit-resources', roles: ['unit_admin','standard'] },
  { displayName: 'Upload Resource', iconName: 'cloud-upload', route: '/unit-admin/upload-resource', roles: ['unit_admin'] },
  {
    navCap: 'Browsing',
    roles: ['unit_admin']
  },
  { displayName: 'Browse Resource', iconName: 'cloud', route: '/workspace/browse-resource', roles: ['unit_admin','super_admin','standard','head_of_entity','country_dir','c_level'] },
  { displayName: 'Structure', iconName: 'sitemap', route: '/tree', roles: ['unit_admin','super_admin', 'standard','head_of_entity','country_dir','c_level'] },
  { displayName: 'Permissions', iconName: 'map', route: '/workspace/permissions', roles: ['unit_admin','super_admin', 'standard','head_of_entity','country_dir','c_level'] },
  // {
  //   displayName: 'Chips',
  //   iconName: 'poker-chip',
  //   route: '/ui-components/chips',
  // },
  // {
  //   displayName: 'Lists',
  //   iconName: 'list',
  //   route: '/ui-components/lists',
  // },
  // {
  //   displayName: 'Menu',
  //   iconName: 'layout-navbar-expand',
  //   route: '/ui-components/menu',
  // },
  // {
  //   displayName: 'Tooltips',
  //   iconName: 'tooltip',
  //   route: '/ui-components/tooltips',
  // },
  // {
  //   navCap: 'Auth',
  // },
  // {
  //   displayName: 'Login',
  //   iconName: 'lock',
  //   route: '/authentication/login',
  // },
  // {
  //   displayName: 'Register',
  //   iconName: 'user-plus',
  //   route: '/authentication/register',
  // },
  // {
  //   navCap: 'Extra',
  // },
  // {
  //   displayName: 'Icons',
  //   iconName: 'mood-smile',
  //   route: '/extra/icons',
  // },
  // {
  //   displayName: 'Sample Page',
  //   iconName: 'aperture',
  //   route: '/extra/sample-page',
  // },
];
