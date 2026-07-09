import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="shrink-0 border-t border-slate-200 bg-white px-4 py-3 lg:px-6">
      <div class="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Back Office · THE LAKE &amp; TERRAINFINITUS</p>
        <p>&copy; {{ currentYear }} Terrainfinitus</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
