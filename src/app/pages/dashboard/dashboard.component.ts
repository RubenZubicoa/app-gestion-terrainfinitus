import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ProjectContextService } from '../../core/services/project-context.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-semibold text-slate-900">Panel de gestión</h1>
      <p class="mt-2 text-slate-600">
        Estás administrando el back-office de
        <span class="font-semibold text-slate-900">{{ projectContext.selectedProject().name }}</span>.
      </p>

      <div class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Estado del proyecto
        </h2>
        <p class="mt-3 text-slate-700">
          La estructura base está lista. Desde aquí podrás añadir las distintas secciones de
          gestión para cada plataforma.
        </p>
        <dl class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Proyecto</dt>
            <dd class="mt-1 text-sm font-semibold text-slate-900">
              {{ projectContext.selectedProject().name }}
            </dd>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Descripción</dt>
            <dd class="mt-1 text-sm text-slate-700">
              {{ projectContext.selectedProject().description }}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  `,
})
export class DashboardComponent {
  protected readonly projectContext = inject(ProjectContextService);
}
