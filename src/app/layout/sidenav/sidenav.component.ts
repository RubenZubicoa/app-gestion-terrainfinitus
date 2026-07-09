import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white"
      aria-label="Navegación principal"
    >
      <div class="border-b border-slate-200 px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Secciones</p>
        <p class="mt-1 text-sm text-slate-600">Más módulos se añadirán próximamente.</p>
      </div>

      <ul class="flex-1 space-y-1 p-3">
        <li>
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-slate-100 text-slate-900 font-medium"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 10v6a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1v-6a1 1 0 00-.293-.707l-7-7z"
              />
            </svg>
            Inicio
          </a>
        </li>
      </ul>
    </nav>
  `,
})
export class SidenavComponent {}
