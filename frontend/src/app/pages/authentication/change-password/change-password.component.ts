import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.changePasswordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('new_password');
    const confirmPassword = form.get('confirm_password');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.changePasswordForm.value;

    this.auth.changePassword({
      current_password: formValue.current_password,
      new_password: formValue.new_password,
      confirm_password: formValue.confirm_password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'Password changed successfully!';
        this.toast.success('Password changed successfully!');
        this.changePasswordForm.reset();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || err.error?.error || '';
        
        if (message.includes('current password') || message.includes('Current password')) {
          this.errorMessage = 'Current password is incorrect.';
        } else if (err.status === 422) {
          this.errorMessage = 'Please check all fields are filled correctly.';
        } else {
          this.errorMessage = 'Failed to change password. Please try again.';
        }
        this.toast.error(this.errorMessage);
      }
    });
  }
}

