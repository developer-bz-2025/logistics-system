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
}
