import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { ProjectContextService } from './core/services/project-context.service';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidenavComponent, FooterComponent],
  host: {
    class: 'flex h-dvh flex-col overflow-hidden',
    '[class]': 'projectContext.selectedProject().accentClass',
  },
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  protected readonly projectContext = inject(ProjectContextService);

  protected readonly showAppLayout = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => !this.router.url.startsWith('/login')),
      startWith(!this.router.url.startsWith('/login')),
    ),
    { initialValue: !this.router.url.startsWith('/login') },
  );
}
