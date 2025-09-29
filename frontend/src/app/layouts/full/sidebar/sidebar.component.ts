import { Component, OnInit } from '@angular/core';
import { navItems } from './sidebar-data';
import { NavService } from '../../../core/services/nav.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  navItems = navItems;

  constructor(public navService: NavService, private auth: AuthService) {}

  ngOnInit(): void {
    const allowed = (navItems || []).filter(item => {
      const roles = (item as any).roles as string[] | undefined;
      return !roles || this.auth.hasAnyRole(roles);
    });
    this.navItems = allowed;
  }
}
