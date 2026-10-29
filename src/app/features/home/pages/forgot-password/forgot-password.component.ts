import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  isLoading = false;
  sentTo: string | null = null;
  error = '';

  constructor(private authService: AuthService) {}

  get email() {
    return this.form.controls.email;
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.error = '';
    const email = this.email.value!.trim();
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.sentTo = email;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Une erreur est survenue. Réessayez dans un instant.';
        this.isLoading = false;
      },
    });
  }
}
