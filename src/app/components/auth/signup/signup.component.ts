import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showPasswordConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const passwordConfirm = control.get('passwordConfirm');

    if (password && passwordConfirm && password.value !== passwordConfirm.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
  get passwordConfirm() { return this.signupForm.get('passwordConfirm'); }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showPasswordConfirm = !this.showPasswordConfirm;
    }
  }

  async onSubmit() {
    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { success, error } = await this.authService.signUp(
        this.email?.value,
        this.password?.value
      );

      if (success) {
        const signInResult = await this.authService.signIn(
          this.email?.value,
          this.password?.value
        );
        
        if (signInResult.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Registrierung erfolgreich. Bitte melde dich jetzt an.';
          this.router.navigate(['/login']);
        }
      } else {
        this.errorMessage = error?.message || 'Registrierung fehlgeschlagen.';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Ein unerwarteter Fehler ist aufgetreten.';
    } finally {
      this.isLoading = false;
    }
  }
}