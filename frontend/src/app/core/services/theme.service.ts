import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

export type AppTheme = 'classic' | 'bz';

// Class added to <html> when the BZ design is active. Every rule in
// assets/scss/themecolors/_theme_bz.scss is scoped under it, so the classic design is untouched.
const THEME_CLASS = 'theme-bz';
const STORAGE_KEY = 'app-theme';
// Earlier toggle stored 'bz' | 'original' here; read once as a fallback, never written.
const LEGACY_KEY = 'app-theme-mode';

// B&Z logos in both designs: the toggle changes colours and layout only.
const LOGOS = {
  mark: './assets/images/logos/bz/bz-mark-burgundy.svg',
  auth: './assets/images/logos/bz/bz-logo-horizontal-color.svg',
  header: './assets/images/logos/bz/bz-logo-horizontal-color.svg',
  sidebar: './assets/images/logos/bz/bz-logo-horizontal-white.svg', // classic dark sidebar
  vertical: './assets/images/logos/bz/bz-logo-vertical-white.svg', // BZ login panel
} as const;

/**
 * Classic (Modernize) design vs BZ design. The choice is saved under "app-theme"
 * only when the user clicks the toggle; otherwise the environment default applies.
 * index.html applies the class before Angular boots, to avoid a flash of the other design.
 *
 * The toggle exists only where environment.allowThemeToggle is true (local development).
 * In production everyone gets BZ and any saved choice is ignored.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly canToggle = environment.allowThemeToggle === true;

  private readonly modeSubject = new BehaviorSubject<AppTheme>(this.resolveInitial());
  readonly mode$ = this.modeSubject.asObservable();

  constructor() {
    this.apply(this.modeSubject.value);
  }

  get mode(): AppTheme {
    return this.modeSubject.value;
  }

  get isBz(): boolean {
    return this.modeSubject.value === 'bz';
  }

  get logos() {
    return LOGOS;
  }

  toggle(): void {
    if (!this.canToggle) return;
    const next: AppTheme = this.isBz ? 'classic' : 'bz';
    this.apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  private resolveInitial(): AppTheme {
    if (!this.canToggle) return 'bz';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bz' || saved === 'classic') {
        return saved;
      }
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy === 'bz') return 'bz';
      if (legacy === 'original') return 'classic';
    } catch {
      /* ignore */
    }
    return environment.defaultTheme === 'classic' ? 'classic' : 'bz';
  }

  private apply(mode: AppTheme): void {
    if (this.modeSubject.value !== mode) {
      this.modeSubject.next(mode);
    }
    document.documentElement.classList.toggle(THEME_CLASS, mode === 'bz');
  }
}
