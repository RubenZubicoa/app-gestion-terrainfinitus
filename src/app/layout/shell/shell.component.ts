import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ProjectContextService } from '../../core/services/project-context.service';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, SidenavComponent, FooterComponent, RouterOutlet],
  host: {
    class: 'flex min-h-dvh flex-col',
    '[class]': 'projectContext.selectedProject().accentClass',
  },
  template: `
    <app-header />

    <div class="project-banner border-b px-4 py-2 lg:px-6" role="status" aria-live="polite">
      <p class="text-sm">
        <span class="font-medium">Gestionando:</span>
        <span class="ml-1 font-semibold">{{ projectContext.selectedProject().name }}</span>
      </p>
    </div>

    <div class="flex min-h-0 flex-1">
      <app-sidenav />

      <main class="app-main min-w-0 flex-1 overflow-auto p-4 lg:p-6" id="main-content">
        <router-outlet />
      </main>
    </div>

    <app-footer />
  `,
})
export class ShellComponent {
  protected readonly projectContext = inject(ProjectContextService);
}
