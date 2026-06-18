import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PortalService } from './core/services/portal.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private title: Title,
    private portal: PortalService
  ) {}

  ngOnInit(): void {
    if (this.portal.isDonorsPortal()) {
      this.title.setTitle(environment.portalDocumentTitle ?? 'Donor Management');
    } else {
      this.title.setTitle(environment.appTitle ?? 'Logistic Assets');
    }
  }
}
