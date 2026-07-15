import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Project, ProjectId } from '../../core/models/the-lake/project';
import { ProjectContextService } from '../../core/services/project-context.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block shrink-0',
  },
  template: `
    <header class="app-header flex h-16 shrink-0 items-center justify-between gap-4 px-4 lg:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="brand-logo flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm"
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
          class="project-switcher flex min-w-44 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition accent-focus"
          [attr.aria-expanded]="projectMenuOpen()"
          aria-haspopup="listbox"
          aria-label="Seleccionar proyecto a gestionar"
          (click)="toggleProjectMenu()"
        >
          <span
            class="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-semibold"
            [class]="projectContext.selectedProject().badgeClass"
          >
            {{ projectContext.selectedProject().name }}
          </span>
          <svg
            class="h-4 w-4 shrink-0 text-slate-500"
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
            class="absolute right-0 z-50 mt-2 w-80 rounded-xl border p-2 shadow-lg surface-panel"
            role="listbox"
            aria-label="Proyectos disponibles"
          >
            <p class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Seleccionar proyecto
            </p>

            <ul class="space-y-1">
              @for (project of projectContext.projects; track project.id) {
                <li>
                  <button
                    type="button"
                    role="option"
                    class="project-menu-item flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition accent-focus"
                    [class.project-menu-item-active]="
                      projectContext.selectedProject().id === project.id
                    "
                    [attr.aria-selected]="projectContext.selectedProject().id === project.id"
                    (click)="selectProject(project.id)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      [class]="project.badgeClass"
                    >
                      {{ projectInitials(project) }}
                    </span>

                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold text-slate-900">
                        {{ project.name }}
                      </span>
                      <span class="block truncate text-xs text-slate-500">
                        {{ project.description }}
                      </span>
                    </span>

                    <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                      @if (projectContext.selectedProject().id === project.id) {
                        <svg
                          class="h-5 w-5 text-[var(--accent)]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3.25-3.25a1 1 0 111.42-1.42l2.54 2.54 6.54-6.54a1 1 0 011.42 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      }
                    </span>
                  </button>
                </li>
              }
            </ul>
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

  protected projectInitials(project: Project): string {
    const words = project.shortLabel.trim().split(/\s+/);

    if (words.length >= 2) {
      return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
    }

    return project.shortLabel.slice(0, 2).toUpperCase();
  }
}
