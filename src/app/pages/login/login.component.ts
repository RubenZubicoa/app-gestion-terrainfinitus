import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-dvh flex-col bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-100">
      <main class="flex flex-1 items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
          <div class="mb-8 text-center">
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 text-base font-bold text-white shadow-md"
              aria-hidden="true"
            >
              BO
            </div>
            <h1 class="mt-4 text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
            <p class="mt-2 text-sm text-slate-600">
              Accede al back-office de THE LAKE y TERRAINFINITUS
            </p>
          </div>

          <form
            class="rounded-2xl border p-6 shadow-sm surface-panel"
            [formGroup]="loginForm"
            (submit)="onSubmit($event)"
            aria-label="Formulario de inicio de sesión"
          >
            <div class="space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="tu@email.com"
                  class="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  [attr.aria-invalid]="emailInvalid"
                />
                @if (emailInvalid) {
                  <p class="mt-1.5 text-xs text-red-600">Introduce un correo válido.</p>
                }
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="Introduce tu contraseña"
                  class="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  [attr.aria-invalid]="passwordInvalid"
                />
                @if (passwordInvalid) {
                  <p class="mt-1.5 text-xs text-red-600">La contraseña es obligatoria.</p>
                }
              </div>
            </div>

            @if (error()) {
              <div
                class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {{ error() }}
              </div>
            }

            <button
              type="submit"
              class="btn-primary mt-6 w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="loading()"
            >
              {{ loading() ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>
        </div>
      </main>

      <footer class="app-footer shrink-0 px-4 py-3 text-center text-xs text-slate-600">
        &copy; {{ currentYear }} Terrainfinitus · Back Office
      </footer>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected get emailInvalid(): boolean {
    const control = this.loginForm.controls.email;
    return control.invalid && control.touched;
  }

  protected get passwordInvalid(): boolean {
    const control = this.loginForm.controls.password;
    return control.invalid && control.touched;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.loading.set(true);

    this.authService
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Credenciales incorrectas o error de conexión. Inténtalo de nuevo.');
        },
      });
  }
}
