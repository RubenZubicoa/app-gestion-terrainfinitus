import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ProjectId } from '../../core/models/the-lake/project';
import { ProjectContextService } from '../../core/services/project-context.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white"
          aria-hidden="true"
        >
          BO
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">Back Office</p>
          <p class="truncate text-xs text-slate-500">Gestión centralizada</p>
        </div>
      </div>

      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          [attr.aria-expanded]="projectMenuOpen()"
          aria-haspopup="listbox"
          aria-label="Seleccionar proyecto a gestionar"
          (click)="toggleProjectMenu()"
        >
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
            [class]="projectContext.selectedProject().badgeClass"
          >
            {{ projectContext.selectedProject().name }}
          </span>
          <svg
            class="h-4 w-4 text-slate-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        @if (projectMenuOpen()) {
          <div
            class="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            role="listbox"
            aria-label="Proyectos disponibles"
          >
            <p class="px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Proyecto activo
            </p>
            @for (project of projectContext.projects; track project.id) {
              <button
                type="button"
                role="option"
                class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                [class.bg-slate-50]="projectContext.selectedProject().id === project.id"
                [attr.aria-selected]="projectContext.selectedProject().id === project.id"
                (click)="selectProject(project.id)"
              >
                <span
                  class="mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                  [class]="project.badgeClass"
                >
                  {{ project.shortLabel }}
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-slate-900">{{ project.name }}</span>
                  <span class="block text-xs text-slate-500">{{ project.description }}</span>
                </span>
              </button>
            }
          </div>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly projectContext = inject(ProjectContextService);
  protected readonly projectMenuOpen = signal(false);

  toggleProjectMenu(): void {
    this.projectMenuOpen.update((open) => !open);
  }

  selectProject(projectId: ProjectId): void {
    this.projectContext.selectProject(projectId);
    this.projectMenuOpen.set(false);
  }
}
