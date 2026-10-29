import { Component } from '@angular/core';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-branding',
  template: `
    <div class="branding">
      <a href="/">
        <img [src]="logoSrc" class="align-middle" alt="Basmeh & Zeitooneh" />
      </a>
    </div>
  `,
})
export class BrandingComponent {
  // White B&Z lockup on the dark sidebar, in both themes
  readonly logoSrc: string;

  constructor(theme: ThemeService) {
    this.logoSrc = theme.logos.sidebar;
  }
}
