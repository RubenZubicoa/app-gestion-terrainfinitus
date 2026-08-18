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
import { forkJoin, of, switchMap, tap } from 'rxjs';

import { Category } from '../../../../core/models/the-lake/Category';
import { CategoryService } from '../../../../core/services/the-lake/category';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  CategoryFormContext,
  CategoryFormDialog,
  CategoryFormSubmit,
  SubcategoryFormItem,
} from '../../components/category-form-dialog/category-form-dialog';

export type CategoryTableRow = {
  uuid: string;
  label: string;
  description?: string;
  category: Category;
};

@Component({
  selector: 'app-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, CategoryFormDialog],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly formContext = signal<CategoryFormContext>({
    mode: 'parent',
    category: null,
  });

  protected readonly tableRows = computed(() => this.mapParentCategories(this.categories()));

  protected readonly tableColumns = computed<DataTableColumn<CategoryTableRow>[]>(() => [
    {
      key: 'label',
      label: 'Nombre',
      cellClass: 'font-medium text-slate-900',
      format: (row) => row.label,
    },
    {
      key: 'description',
      label: 'Descripción',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (row) => row.description || '—',
    },
    {
      key: 'image',
      label: 'Imagen',
      cellClass: 'text-slate-600',
      format: (row) => (row.category.image ? 'Sí' : 'No'),
    },
  ]);

  ngOnInit(): void {
    this.loadCategories();
  }

  protected openAddCategoryForm(): void {
    this.formContext.set({ mode: 'parent', category: null });
    this.showForm.set(true);
  }

  protected openAddSubcategoryForm(): void {
    this.formContext.set({
      mode: 'subcategory',
      category: null,
      parentCategory: null,
    });
    this.showForm.set(true);
  }

  protected openEditForm(row: CategoryTableRow): void {
    this.formContext.set({
      mode: 'parent',
      category: row.category,
    });
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.formContext.set({ mode: 'parent', category: null });
  }

  protected onCategorySubmitted(payload: CategoryFormSubmit): void {
    if (payload.mode === 'parent') {
      this.saveParentCategory(payload);
      return;
    }

    this.saveSubcategory(payload);
  }

  protected deleteCategory(row: CategoryTableRow): void {
    const confirmed = confirm(`¿Eliminar categoría "${row.label}"?`);

    if (!confirmed) {
      return;
    }

    this.categoryService
      .deleteCategory(row.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCategories();
          this.setSuccess('La categoría se eliminó correctamente.');
        },
        error: () => this.setError('No se pudo eliminar la categoría.'),
      });
  }

  protected trackCategoryRow(row: CategoryTableRow): string {
    return row.uuid;
  }

  private saveParentCategory(
    payload: Extract<CategoryFormSubmit, { mode: 'parent' }>,
  ): void {
    const parentPayload = {
      label: payload.values.label,
      description: payload.values.description,
      image: payload.imageFile ?? undefined,
    };

    const request = payload.uuid
      ? this.categoryService.updateCategory(payload.uuid, parentPayload)
      : this.categoryService.createCategory(parentPayload);

    request
      .pipe(
        tap(() => this.closeForm()),
        switchMap((parent) => {
          const parentUuid = parent.uuid || payload.uuid;

          if (!parentUuid) {
            return of(null);
          }

          return this.syncSubcategories(parentUuid, payload.subcategories);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadCategories();
          this.setSuccess(
            payload.uuid
              ? 'La categoría se actualizó correctamente.'
              : 'La categoría se creó correctamente.',
          );
        },
        error: () =>
          this.setError(
            payload.uuid ? 'No se pudo actualizar la categoría.' : 'No se pudo crear la categoría.',
          ),
      });
  }

  private saveSubcategory(
    payload: Extract<CategoryFormSubmit, { mode: 'subcategory' }>,
  ): void {
    const body = {
      label: payload.values.label,
      description: payload.values.description,
      image: payload.imageFile ?? undefined,
    };

    const request = payload.uuid
      ? this.categoryService.updateSubCategory(payload.uuid, payload.parentUuid, body)
      : this.categoryService.createSubCategory(payload.parentUuid, body);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.closeForm();
        this.loadCategories();
        this.setSuccess(
          payload.uuid
            ? 'La subcategoría se actualizó correctamente.'
            : 'La subcategoría se creó correctamente.',
        );
      },
      error: () =>
        this.setError(
          payload.uuid ? 'No se pudo actualizar la subcategoría.' : 'No se pudo crear la subcategoría.',
        ),
    });
  }

  private syncSubcategories(parentUuid: string, subcategories: SubcategoryFormItem[]) {
    if (subcategories.length === 0) {
      return of(null);
    }

    return forkJoin(
      subcategories.map((subcategory) => {
        const body = {
          label: subcategory.label,
          description: subcategory.description || undefined,
          image: subcategory.imageFile ?? undefined,
        };

        if (subcategory.uuid) {
          return this.categoryService.updateSubCategory(subcategory.uuid, parentUuid, body);
        }

        return this.categoryService.createSubCategory(parentUuid, body);
      }),
    );
  }

  private setSuccess(message: string): void {
    this.error.set(null);
    this.success.set(message);
  }

  private setError(message: string): void {
    this.success.set(null);
    this.error.set(message);
  }

  private mapParentCategories(categories: Category[]): CategoryTableRow[] {
    return categories.map((category) => ({
      uuid: category.uuid,
      label: category.label,
      description: category.description,
      category,
    }));
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoryService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las categorías.');
        },
      });
  }
}
