import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NewsLetter } from '../../../../core/models/the-lake/NewsLetter';
import { NewsLetterService } from '../../../../core/services/the-lake/newsletter.service';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  NewsLetterFormDialog,
  NewsLetterFormSubmit,
} from '../../components/newsletter-form-dialog/newsletter-form-dialog';

@Component({
  selector: 'app-newsletters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, NewsLetterFormDialog],
  templateUrl: './newsletters.html',
  styleUrl: './newsletters.css',
})
export class NewsLetters implements OnInit {
  private readonly newsLetterService = inject(NewsLetterService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly newsLetters = signal<NewsLetter[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingNewsLetter = signal<NewsLetter | null>(null);

  protected readonly tableColumns = computed<DataTableColumn<NewsLetter>[]>(() => [
    {
      key: 'title',
      label: 'Título',
      cellClass: 'font-medium text-slate-900',
      format: (item) => item.title,
    },
    {
      key: 'path',
      label: 'PDF',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (item) => item.path || '—',
    },
    {
      key: 'pathImage',
      label: 'Imagen',
      cellClass: 'text-slate-600',
      format: (item) => (item.pathImage ? 'Sí' : 'No'),
    },
    {
      key: 'publishedAt',
      label: 'Estado',
      cellClass: (item) =>
        item.publishedAt
          ? 'font-medium text-emerald-700'
          : 'font-medium text-amber-700',
      format: (item) =>
        item.publishedAt
          ? `Publicado · ${new Date(item.publishedAt).toLocaleDateString('es-ES')}`
          : 'No publicado',
    },
  ]);

  ngOnInit(): void {
    this.loadNewsLetters();
  }

  protected openAddForm(): void {
    this.editingNewsLetter.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(newsLetter: NewsLetter): void {
    this.editingNewsLetter.set(newsLetter);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingNewsLetter.set(null);
  }

  protected onNewsLetterSubmitted(payload: NewsLetterFormSubmit): void {
    if (payload.uuid) {
      this.newsLetterService
        .updateNewsLetter(payload.uuid, {
          title: payload.values.title,
          ...(payload.pdfFile ? { path: payload.pdfFile } : {}),
          ...(payload.imageFile ? { pathImage: payload.imageFile } : {}),
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadNewsLetters();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el newsletter.'),
        });
      return;
    }

    if (!payload.pdfFile) {
      this.error.set('Debes seleccionar un PDF para crear el newsletter.');
      return;
    }

    this.newsLetterService
      .createNewsLetter({
        title: payload.values.title,
        path: payload.pdfFile,
        ...(payload.imageFile ? { pathImage: payload.imageFile } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadNewsLetters();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el newsletter.'),
      });
  }

  protected deleteNewsLetter(newsLetter: NewsLetter): void {
    const confirmed = confirm(`¿Eliminar el newsletter "${newsLetter.title}"?`);

    if (!confirmed) {
      return;
    }

    this.newsLetterService
      .deleteNewsLetter(newsLetter.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadNewsLetters(),
        error: () => this.error.set('No se pudo eliminar el newsletter.'),
      });
  }

  protected publishNewsLetter(newsLetter: NewsLetter): void {
    const alreadyPublished = Boolean(newsLetter.publishedAt);
    const confirmed = confirm(
      alreadyPublished
        ? `El boletín "${newsLetter.title}" ya fue publicado. ¿Quieres publicarlo de nuevo?`
        : `¿Publicar el boletín "${newsLetter.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.newsLetterService
      .publishNewsLetter(newsLetter.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.error.set(null);
          this.loadNewsLetters();
        },
        error: () => this.error.set('No se pudo publicar el boletín.'),
      });
  }

  protected trackNewsLetter(newsLetter: NewsLetter): string {
    return newsLetter.uuid;
  }

  private loadNewsLetters(): void {
    this.loading.set(true);
    this.error.set(null);

    this.newsLetterService
      .getNewsLetters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.newsLetters.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los newsletters.');
        },
      });
  }
}
