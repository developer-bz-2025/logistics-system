import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class AppSideLoginComponent {

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';


  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private jwt: JwtService,
    private router: Router
  ) {

  }

  ngOnInit() {
    console.log('[Login] Component init');
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }


  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const { email } = this.loginForm.value;
    console.log('[Login] Submitting with email:', email);

    this.auth.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('[Login] Login success, token length:', res?.access_token?.length ?? 0);
        const prePayload = this.jwt.getPayload<any>();
        console.log('[Login] Decoded payload before hydrate:', prePayload);
        this.auth.initializeFromToken(res.access_token).subscribe((user) => {
          console.log('[Login] User loaded after hydrate:', user);
          const payload = this.jwt.getPayload<any>();
          const payloadRoles = (payload?.roles ?? payload?.role ?? []) as any;
          const rolesRaw = user?.roles ?? (user as any)?.role ?? this.auth.user()?.roles ?? payloadRoles;
          const rolesArr: string[] = Array.isArray(rolesRaw) ? rolesRaw : (rolesRaw ? [rolesRaw] : []);
          const roles = rolesArr.map(r => String(r).toLowerCase());
          console.log('[Login] Computed roles:', roles);
          if (roles.includes('super_admin') || roles.includes('c_level')) this.router.navigateByUrl('/pages/dashboard');
          else if (roles.includes('unit_admin')) this.router.navigateByUrl('/unit-admin/dashboard');
          else if (roles.includes('standard')) this.router.navigateByUrl('/unit-admin/my-unit-resources');
          else this.router.navigateByUrl('/workspace/browse-resource');
          console.log('[Login] Navigation attempted based on roles');
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
