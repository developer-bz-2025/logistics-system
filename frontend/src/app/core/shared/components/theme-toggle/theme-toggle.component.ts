import { Component } from '@angular/core';
import { ThemeService } from 'src/app/core/services/theme.service';

/** Switches between the classic and BZ designs. Used in both top bars and on the login page. */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="theme-toggle"
      [class.is-bz]="theme.isBz"
      [attr.aria-pressed]="theme.isBz"
      title="Switch design"
      (click)="theme.toggle()">
      <svg class="theme-toggle__icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 21a9 9 0 0 1 0-18c4.97 0 9 3.58 9 8 0 1.06-.47 2.08-1.32 2.83-.84.75-1.98 1.17-3.18 1.17H14a2 2 0 0 0-1 3.75A1.3 1.3 0 0 1 12 21"/>
        <circle cx="7.5" cy="10.5" r=".5" fill="currentColor"/>
        <circle cx="12" cy="7.5" r=".5" fill="currentColor"/>
        <circle cx="16.5" cy="10.5" r=".5" fill="currentColor"/>
      </svg>
      <span class="theme-toggle__label">{{ theme.isBz ? 'Classic design' : 'New design' }}</span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    /* Classic design: the teal chip it has always had in the white top bar */
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 4px 10px;
      border: 1px solid var(--app-primary, #0d9488);
      border-radius: var(--app-radius-control, 7px);
      background: var(--app-primary, #0d9488);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .theme-toggle:hover { opacity: 0.9; }
    .theme-toggle:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

    /* BZ design: light chip, like the other top bar buttons */
    .theme-toggle.is-bz {
      height: 38px;
      padding: 0 0.85rem;
      border-color: rgba(111, 25, 33, 0.16);
      border-radius: 10px;
      background: #ffffff;
      color: var(--bz-ink, #1a1214);
      font-family: var(--bz-font-body, inherit);
      font-size: 0.85rem;
      letter-spacing: 0;
      opacity: 1;
    }
    .theme-toggle.is-bz .theme-toggle__icon { color: var(--bz-burgundy, #6f1921); }
    .theme-toggle.is-bz:hover { background: rgba(111, 25, 33, 0.05); color: var(--bz-burgundy, #6f1921); }
    .theme-toggle.is-bz:focus-visible { outline-color: var(--bz-burgundy, #6f1921); }

    @media (max-width: 576px) {
      .theme-toggle__label { display: none; }
    }
  `],
})
export class ThemeToggleComponent {
  constructor(public theme: ThemeService) {}
}
