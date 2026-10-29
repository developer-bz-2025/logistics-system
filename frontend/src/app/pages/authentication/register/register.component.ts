import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from 'src/app/core/services/theme.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class AppSideRegisterComponent implements OnInit, OnDestroy {
  isBzTheme = true;
  authLogo = './assets/images/logos/bz/bz-logo-horizontal-color.svg';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private theme: ThemeService
  ) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    this.theme.mode$.pipe(takeUntil(this.destroy$)).subscribe((mode) => {
      this.isBzTheme = mode === 'bz';
      this.authLogo = this.theme.logos.auth;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.form.controls;
  }

  submit() {
    // console.log(this.form.value);
    this.router.navigate(['/dashboard']);
  }
}
