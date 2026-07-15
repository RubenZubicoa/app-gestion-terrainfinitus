import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block shrink-0',
  },
  template: `
    <footer class="app-footer shrink-0 px-4 py-3 lg:px-6">
      <div class="flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Back Office · THE LAKE &amp; TERRAINFINITUS</p>
        <p>&copy; {{ currentYear }} Terrainfinitus</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
