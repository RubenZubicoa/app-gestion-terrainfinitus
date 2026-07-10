import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NavSectionIcon } from '../../core/models/nav-section';
import { ProjectContextService } from '../../core/services/project-context.service';

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
        <p class="mt-1 truncate text-sm font-medium text-slate-900">
          {{ projectContext.selectedProject().name }}
        </p>
      </div>

      <ul class="flex-1 space-y-1 p-3">
        @for (section of projectContext.selectedSections(); track section.id) {
          <li>
            <a
              [routerLink]="section.path"
              routerLinkActive="bg-slate-100 text-slate-900 font-medium"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              [routerLinkActiveOptions]="{ exact: section.path === '/dashboard' }"
            >
              <svg
                class="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path [attr.d]="iconPath(section.icon)" />
              </svg>
              {{ section.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class SidenavComponent {
  protected readonly projectContext = inject(ProjectContextService);

  protected iconPath(icon: NavSectionIcon): string {
    const paths: Record<NavSectionIcon, string> = {
      home: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 10v6a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1v-6a1 1 0 00-.293-.707l-7-7z',
      box: 'M5.5 3A2.5 2.5 0 003 5.5v9A2.5 2.5 0 005.5 17h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 3h-9zM5 5.5a.5.5 0 01.5-.5h9a.5.5 0 01.5.5v1.793l-4.25 2.125a1 1 0 01-.894 0L5 7.293V5.5zm0 3.707l4.25 2.125a1 1 0 00.894 0L14.5 9.207V15.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V9.207z',
      folder:
        'M2 6a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0010.414 6H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z',
      tag: 'M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.768l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 6a1 1 0 100-2 1 1 0 000 2z',
      cart: 'M3 3a1 1 0 000 2h1.22l.305 1.222a1 1 0 00.949.778h9.528a1 1 0 00.949-.778L16.78 5H18a1 1 0 100-2H3zm2.22 5l-.617 2.47A2 2 0 006.44 13h7.12a2 2 0 001.836-1.53L16.22 8H5.22z',
      users:
        'M7 8a3 3 0 116 0 3 3 0 01-6 0zm-2 7a4 4 0 018 0v1H5v-1zm9-1a3 3 0 00-3-3 1 1 0 10-2 0 5 5 0 00-4.9 4H15a1 1 0 001-1v-1z',
      calendar:
        'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 4a1 1 0 000 2h8a1 1 0 100-2H6z',
      document:
        'M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414A1 1 0 0116 10.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 0v3a1 1 0 001 1h3',
      settings:
        'M11.983 1.907a.75.75 0 00-1.466-.163l-.63 2.52a6.97 6.97 0 00-1.62.938l-2.36-1.36a.75.75 0 00-.932.19l-1.5 2.598a.75.75 0 00.19.932l2.36 1.36c-.08.53-.08 1.072 0 1.602l-2.36 1.36a.75.75 0 00-.19.932l1.5 2.598a.75.75 0 00.932.19l2.36-1.36c.5.27 1.05.47 1.62.602l.63 2.52a.75.75 0 001.466-.163l.63-2.52a6.97 6.97 0 001.62-.938l2.36 1.36a.75.75 0 00.932-.19l1.5-2.598a.75.75 0 00-.19-.932l-2.36-1.36c.08-.53.08-1.072 0-1.602l2.36-1.36a.75.75 0 00.19-.932l-1.5-2.598a.75.75 0 00-.932-.19l-2.36 1.36a6.97 6.97 0 00-1.62-.938l-.63-2.52zM10 13a3 3 0 100-6 3 3 0 000 6z',
    };

    return paths[icon];
  }
}
