import { Component, OnInit } from '@angular/core';
import { navItems } from './sidebar-data';
import { NavService } from '../../../core/services/nav.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CategoryService } from 'src/app/core/services/category.service';
import { NavItem } from './nav-item/nav-item';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  navItems = navItems;
  isLoadingCategories = false;

  constructor(
    public navService: NavService,
    private auth: AuthService,
    private categoryService: CategoryService
  ) {}

  // Map category names to appropriate icons
  private getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'Furniture': 'armchair',
      'Appliances': 'device-tv',
      'Machine': 'settings',
      'Vehicle': 'car',
      'Electronics': 'device-desktop',
      'IT Equipment': 'device-laptop',
      // Default fallback icon
      'default': 'package'
    };

    // Try exact match first
    if (iconMap[categoryName]) {
      return iconMap[categoryName];
    }

    // Try case-insensitive match
    const lowerName = categoryName.toLowerCase();
    for (const [key, value] of Object.entries(iconMap)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }

    // Check for partial matches
    if (lowerName.includes('furniture') || lowerName.includes('chair') || lowerName.includes('table')) {
      return 'armchair';
    }
    if (lowerName.includes('appliance') || lowerName.includes('kitchen')) {
      return 'device-tv';
    }
    if (lowerName.includes('machine') || lowerName.includes('equipment')) {
      return 'cog';
    }
    if (lowerName.includes('vehicle') || lowerName.includes('car') || lowerName.includes('truck')) {
      return 'car';
    }
    if (lowerName.includes('electronic') || lowerName.includes('computer')) {
      return 'device-desktop';
    }
    if (lowerName.includes('it') || lowerName.includes('laptop') || lowerName.includes('server')) {
      return 'device-laptop';
    }

    return iconMap['default'];
  }

  ngOnInit(): void {
    const allowed = (navItems || []).filter(item => {
      const roles = (item as any).roles as string[] | undefined;
      return !roles || this.auth.hasAnyRole(roles);
    });
    this.navItems = allowed;

    // find the categories placeholder and populate its children from backend
    const categoriesItem = this.navItems.find(i => i.displayName === 'Categories' || i.expandable === true);
    if (categoriesItem) {
      this.isLoadingCategories = true;
      this.categoryService.getCategories().subscribe({
        next: (cats: any[]) => {
          categoriesItem.children = (cats || []).map(c => ({
            displayName: c.name,
            iconName: this.getCategoryIcon(c.name),
            route: '/assets',
            queryParams: { category_id: c.id },
          } as NavItem));
          // ensure expanded property exists (start collapsed)
          if (categoriesItem.expanded === undefined) categoriesItem.expanded = false;
          this.isLoadingCategories = false;
        },
        error: () => {
          this.isLoadingCategories = false;
        }
      });
    }
  }
}
