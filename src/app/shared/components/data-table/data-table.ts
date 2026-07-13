import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  headerClass?: string;
  cellClass?: string;
  format?: (row: T) => string | number;
}

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.html',
})
export class DataTableComponent<T> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly loadingMessage = input('Cargando...');
  readonly emptyMessage = input('No hay datos.');
  readonly trackBy = input.required<(row: T) => string>();
  readonly showActions = input(true);
  readonly pageSize = input(10);

  readonly edit = output<T>();
  readonly delete = output<T>();

  protected readonly currentPage = signal(1);

  protected readonly totalPages = computed(() => {
    const total = this.rows().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  protected readonly paginatedRows = computed(() => {
    const rows = this.rows();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return rows.slice(start, start + size);
  });

  protected readonly paginationLabel = computed(() => {
    const total = this.rows().length;
    if (total === 0) {
      return '';
    }

    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `${start}–${end} de ${total}`;
  });

  protected readonly canGoPrevious = computed(() => this.currentPage() > 1);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages());

  constructor() {
    effect(() => {
      this.rows();
      this.pageSize();
      this.currentPage.set(1);
    });
  }

  protected cellValue(row: T, column: DataTableColumn<T>): string | number {
    if (column.format) {
      return column.format(row);
    }

    const value = (row as Record<string, unknown>)[column.key];
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }

  protected previousPage(): void {
    if (this.canGoPrevious()) {
      this.currentPage.update((page) => page - 1);
    }
  }

  protected nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage.update((page) => page + 1);
    }
  }

  protected onEdit(row: T): void {
    this.edit.emit(row);
  }

  protected onDelete(row: T): void {
    this.delete.emit(row);
  }
}
