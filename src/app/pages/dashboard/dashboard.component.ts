import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProjectContextService } from '../../core/services/project-context.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-5xl">
      <div class="page-card">
        <div class="page-card-header">
          <h1 class="page-title">Panel de gestión</h1>
          <p class="page-subtitle">
            Estás administrando el back-office de
            <span class="font-semibold" style="color: var(--accent-text)">
              {{ projectContext.selectedProject().name }}
            </span>.
          </p>
        </div>

        <div class="p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <article class="stat-card">
              <p class="stat-card-label">Proyecto activo</p>
              <p class="stat-card-value">{{ projectContext.selectedProject().name }}</p>
            </article>
            <article class="stat-card">
              <p class="stat-card-label">Secciones disponibles</p>
              <p class="stat-card-value">{{ projectContext.selectedSections().length }}</p>
            </article>
          </div>

          <div class="mt-8">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Accesos rápidos
            </h2>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (section of quickSections(); track section.id) {
                <li>
                  <a
                    [routerLink]="section.path"
                    class="group flex items-center justify-between rounded-xl border px-4 py-3 transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)] accent-focus"
                    style="border-color: #e2e8f0"
                  >
                    <span class="text-sm font-medium text-slate-800">{{ section.label }}</span>
                    <span
                      class="text-xs font-semibold transition group-hover:translate-x-0.5"
                      style="color: var(--accent)"
                    >
                      Ir →
                    </span>
                  </a>
                </li>
              }
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class DashboardComponent {
  protected readonly projectContext = inject(ProjectContextService);

  protected quickSections() {
    return this.projectContext.selectedSections().filter((section) => section.id !== 'dashboard');
  }
}
