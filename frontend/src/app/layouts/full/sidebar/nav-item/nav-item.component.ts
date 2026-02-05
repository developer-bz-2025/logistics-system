import { Component, Input, OnChanges } from '@angular/core';
import { NavItem } from './nav-item';
import { Router } from '@angular/router';
import { NavService } from '../../../../core/services/nav.service';

@Component({
  selector: 'app-nav-item',
  templateUrl: './nav-item.component.html',
  styles: [`
    .children-list {
      padding-left: 12px;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      margin-left: 12px;
    }

    .children-list .child-menu-item {
      padding-left: 24px !important;
      font-size: 0.92rem;
    }

    .children-list .child-menu-item .hide-menu {
      opacity: 0.85;
    }

    .hide-menu.small-text {
      font-size: 0.80rem;
    }
  `],
})
export class AppNavItemComponent implements OnChanges {
  @Input() item: NavItem | any;
  @Input() depth: any;

  constructor(public navService: NavService, public router: Router) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnChanges() {
    this.navService.currentUrl.subscribe((url: string) => {
      if (this.item.route && url) {
      }
    });
  }

  onItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      if (item.queryParams) {
        this.router.navigate([item.route], { queryParams: item.queryParams });
      } else {
        this.router.navigate([item.route]);
      }
    }

    // scroll
    document.querySelector('.page-wrapper')?.scroll({
      top: 0,
      left: 0,
    });
  }

  isActive(item: NavItem): boolean {
    if (!item.route) return false;
    const currentPath = this.router.url.split('?')[0];
    if (currentPath !== item.route) return false;
    
    const queryParams = this.router.parseUrl(this.router.url).queryParams;
    
    if (item.queryParams) {
      // Item has specific query params - check if all match
      return Object.entries(item.queryParams).every(
        ([key, value]) => queryParams[key] && String(queryParams[key]) === String(value)
      );
    } else {
      // Item has no query params (like "All Assets")
      // Only active if there's no category_id in the URL (or other conflicting params)
      // Allow pagination/filter params like page, pageSize, search, status_id, etc.
      const conflictingParams = ['category_id', 'sub_category_id', 'fixed_item_id'];
      return !conflictingParams.some(param => queryParams[param] !== undefined);
    }
  }
}
