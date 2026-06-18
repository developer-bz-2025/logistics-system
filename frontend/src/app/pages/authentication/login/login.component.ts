import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { PortalService } from 'src/app/core/services/portal.service';
import { Router, ActivatedRoute } from '@angular/router';
import { extractRoles } from '../role.util';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class AppSideLoginComponent {

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  isDonorsPortal = false;


  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private jwt: JwtService,
    private router: Router,
    private portal: PortalService,
    private route: ActivatedRoute
  ) {

  }

  ngOnInit() {
    this.isDonorsPortal = this.portal.isDonorsPortal();
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    if (this.route.snapshot.queryParamMap.get('portal') === 'finance-only') {
      this.errorMessage = 'This portal is for finance users only.';
    }

    if (this.isDonorsPortal && this.auth.isLoggedIn()) {
      if (this.auth.hasAnyRole(['finance'])) {
        this.router.navigateByUrl('/finance');
        return;
      }
      this.auth.logout();
    }
  }


  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const { email } = this.loginForm.value;
    console.log('[Login] Submitting with email:', email);

    this.auth.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('[Login] Login success, access_token length:', res?.access_token?.length ?? 0, 'refresh_token length:', res?.refresh_token?.length ?? 0);
        const prePayload = this.jwt.getPayload<any>();
        console.log('[Login] Decoded payload before hydrate:', prePayload);
        this.auth.initializeFromTokens(res.access_token, res.refresh_token).subscribe((user) => {
          const roles = extractRoles(user);

          if (this.portal.isDonorsPortal()) {
            if (!roles.includes('finance')) {
              this.auth.logout();
              this.errorMessage = 'This portal is for finance users only.';
              this.loading = false;
              return;
            }
            this.router.navigateByUrl('/finance');
            return;
          }

          if (roles.includes('super_admin')) this.router.navigateByUrl('/dashboard');
          else if (roles.includes('pr_admin')) this.router.navigateByUrl('/pr');
          else if (roles.includes('log_admin')) this.router.navigateByUrl('/dashboard');
          else if (roles.includes('finance')) this.router.navigateByUrl('/finance');
          else this.router.navigateByUrl('/');
        });
        // console.log(res)
        // this.auth.saveToken(res.access_token);
        // this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('[Login] Login error:', err);

        this.loading = false;

        const message = err.error?.error || '';

        if (message.includes('Email not found')) {
          this.errorMessage = 'This email is not registered.';
        } else if (message.includes('Incorrect password')) {
          this.errorMessage = 'Incorrect password. Please try again.';
        } else if (err.status === 422) {
          this.errorMessage = 'Email or password is required.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      },
      complete: () => {
        this.loading = false;
        console.log('[Login] Request complete');
      }
    });
  }


}
