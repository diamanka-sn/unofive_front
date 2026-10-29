import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';

const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  private fb = inject(FormBuilder);
  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );
  showPassword = false;
  isLoading = false;
  done = false;
  error = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  get password() {
    return this.form.controls.password;
  }

  get confirm() {
    return this.form.controls.confirm;
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.error = '';
    this.authService.resetPassword(this.token, this.password.value!).subscribe({
      next: () => {
        this.done = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Une erreur est survenue. Réessayez dans un instant.';
        this.isLoading = false;
      },
    });
  }
}
