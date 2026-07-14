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
  type: 'Categoría' | 'Subcategoría';
  parentLabel?: string;
  category: Category;
  parentCategory?: Category;
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
  protected readonly showForm = signal(false);
  protected readonly formContext = signal<CategoryFormContext>({
    mode: 'parent',
    category: null,
  });

  protected readonly tableRows = computed(() => this.flattenCategories(this.categories()));

  protected readonly tableColumns = computed<DataTableColumn<CategoryTableRow>[]>(() => [
    {
      key: 'label',
      label: 'Nombre',
      cellClass: 'font-medium text-slate-900',
      format: (row) => (row.type === 'Subcategoría' ? `↳ ${row.label}` : row.label),
    },
    {
      key: 'type',
      label: 'Tipo',
      cellClass: 'text-slate-600',
      format: (row) => row.type,
    },
    {
      key: 'parentLabel',
      label: 'Categoría padre',
      cellClass: 'text-slate-600',
      format: (row) => row.parentLabel || '—',
    },
    {
      key: 'description',
      label: 'Descripción',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (row) => row.description || '—',
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
    if (row.type === 'Subcategoría' && row.parentCategory) {
      this.formContext.set({
        mode: 'subcategory',
        category: row.category,
        parentCategory: row.parentCategory,
      });
    } else {
      this.formContext.set({
        mode: 'parent',
        category: row.category,
      });
    }

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
    const confirmed = confirm(`¿Eliminar ${row.type.toLowerCase()} "${row.label}"?`);

    if (!confirmed) {
      return;
    }

    if (row.type === 'Subcategoría' && row.parentCategory) {
      const children = (row.parentCategory.children ?? []).filter(
        (child) => child.uuid !== row.uuid,
      );

      this.categoryService
        .updateCategory(row.parentCategory.uuid, { children })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.loadCategories(),
          error: () => this.error.set('No se pudo eliminar la subcategoría.'),
        });
      return;
    }

    this.categoryService
      .deleteCategory(row.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadCategories(),
        error: () => this.error.set('No se pudo eliminar la categoría.'),
      });
  }

  protected trackCategoryRow(row: CategoryTableRow): string {
    return row.uuid;
  }

  private saveParentCategory(
    payload: Extract<CategoryFormSubmit, { mode: 'parent' }>,
  ): void {
    const children = this.mapSubcategoriesToChildren(payload.subcategories);

    if (payload.uuid) {
      this.categoryService
        .updateCategory(payload.uuid, {
          label: payload.values.label,
          description: payload.values.description,
          children,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadCategories();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar la categoría.'),
        });
      return;
    }

    this.categoryService
      .createCategory({
        label: payload.values.label,
        description: payload.values.description,
        children,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCategories();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear la categoría.'),
      });
  }

  private saveSubcategory(
    payload: Extract<CategoryFormSubmit, { mode: 'subcategory' }>,
  ): void {
    const parent = this.categories().find((category) => category.uuid === payload.parentUuid);

    if (!parent) {
      this.error.set('No se encontró la categoría padre.');
      return;
    }

    const children = [...(parent.children ?? [])];

    if (payload.uuid) {
      const index = children.findIndex((child) => child.uuid === payload.uuid);

      if (index === -1) {
        this.error.set('No se encontró la subcategoría.');
        return;
      }

      children[index] = {
        ...children[index],
        label: payload.values.label,
        description: payload.values.description,
      };
    } else {
      children.push({
        uuid: crypto.randomUUID(),
        label: payload.values.label,
        description: payload.values.description,
      });
    }

    this.categoryService
      .updateCategory(parent.uuid, { children })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCategories();
          this.closeForm();
        },
        error: () =>
          this.error.set(
            payload.uuid ? 'No se pudo actualizar la subcategoría.' : 'No se pudo crear la subcategoría.',
          ),
      });
  }

  private mapSubcategoriesToChildren(subcategories: SubcategoryFormItem[]): Category[] {
    return subcategories.map((subcategory) => ({
      uuid: subcategory.uuid ?? crypto.randomUUID(),
      label: subcategory.label,
      description: subcategory.description || undefined,
    }));
  }

  private flattenCategories(categories: Category[]): CategoryTableRow[] {
    const rows: CategoryTableRow[] = [];

    for (const category of categories) {
      rows.push({
        uuid: category.uuid,
        label: category.label,
        description: category.description,
        type: 'Categoría',
        category,
      });

      for (const child of category.children ?? []) {
        rows.push({
          uuid: child.uuid,
          label: child.label,
          description: child.description,
          type: 'Subcategoría',
          parentLabel: category.label,
          category: child,
          parentCategory: category,
        });
      }
    }

    return rows;
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
