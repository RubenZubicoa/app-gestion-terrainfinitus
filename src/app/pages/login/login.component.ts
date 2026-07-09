import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-dvh flex-col bg-slate-50">
      <main class="flex flex-1 items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
          <div class="mb-8 text-center">
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-base font-bold text-white"
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
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
                  class="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                />
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
                  class="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              class="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>

      <footer class="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
        &copy; {{ currentYear }} Terrainfinitus · Back Office
      </footer>
    </div>
  `,
})
export class LoginComponent {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
  }
}
