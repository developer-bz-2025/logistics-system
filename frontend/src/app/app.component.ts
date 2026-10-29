import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PortalService } from './core/services/portal.service';
import { ThemeService } from './core/services/theme.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private title: Title,
    private portal: PortalService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    void this.theme.mode;

    if (this.portal.isDonorsPortal()) {
      this.title.setTitle(environment.portalDocumentTitle ?? 'Donor Management');
    } else {
      this.title.setTitle(environment.appTitle ?? 'Logistic Assets');
    }
  }
}
