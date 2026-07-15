import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ProjectContextService } from './core/services/project-context.service';
import { HeaderComponent } from './layout/header/header.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidenavComponent],
  host: {
    class: 'flex h-dvh flex-col overflow-hidden',
    '[class]': 'projectContext.selectedProject().accentClass',
  },
  templateUrl: './app.html',
})
export class App {
  protected readonly projectContext = inject(ProjectContextService);
}
