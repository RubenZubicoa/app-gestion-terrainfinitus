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

import { Product } from '../../../../core/models/terrainfinitus/GourmetProduct';
import { GourmetProductService } from '../../../../core/services/terrainfinitus/gourmet-product.service';
import { formatEuro } from '../../../../shared/utils/currency';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  GourmetProductFormDialog,
  GourmetProductFormSubmit,
} from '../../components/gourmet-product-form-dialog/gourmet-product-form-dialog';

type TriFilter = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-gourmet-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, GourmetProductFormDialog],
  templateUrl: './gourmet-products.html',
  styleUrl: './gourmet-products.css',
})
export class GourmetProducts implements OnInit {
  private readonly gourmetProductService = inject(GourmetProductService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);

  protected readonly nameFilter = signal('');
  protected readonly categoryFilter = signal('all');
  protected readonly sectionFilter = signal('all');
  protected readonly activeFilter = signal<TriFilter>('all');

  protected readonly activeFilterOptions: { value: TriFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'yes', label: 'Sí' },
    { value: 'no', label: 'No' },
  ];

  protected readonly categoryFilterOptions = computed(() => {
    const categories = [
      ...new Set(
        this.products()
          .map((product) => product.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));

    return [
      { value: 'all', label: 'Todas' },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  });

  protected readonly sectionFilterOptions = computed(() => {
    const sections = [
      ...new Set(
        this.products()
          .map((product) => product.sectionId?.trim())
          .filter((section): section is string => Boolean(section)),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));

    return [
      { value: 'all', label: 'Todas' },
      ...sections.map((section) => ({ value: section, label: section })),
    ];
  });

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.nameFilter().trim() !== '' ||
      this.categoryFilter() !== 'all' ||
      this.sectionFilter() !== 'all' ||
      this.activeFilter() !== 'all'
    );
  });

  protected readonly filteredProducts = computed(() => {
    const name = this.nameFilter().trim().toLowerCase();
    const category = this.categoryFilter();
    const section = this.sectionFilter();
    const active = this.activeFilter();

    return this.products().filter((product) => {
      if (name) {
        const productName = (product.i18n?.es?.name || product.nameKey || '').toLowerCase();
        const slug = (product.slug || '').toLowerCase();
        const key = (product.key || '').toLowerCase();

        if (!productName.includes(name) && !slug.includes(name) && !key.includes(name)) {
          return false;
        }
      }

      if (category !== 'all' && product.category !== category) {
        return false;
      }

      if (section !== 'all' && product.sectionId !== section) {
        return false;
      }

      if (active === 'yes' && !product.active) {
        return false;
      }

      if (active === 'no' && product.active) {
        return false;
      }

      return true;
    });
  });

  protected readonly tableColumns = computed<DataTableColumn<Product>[]>(() => [
    {
      key: 'name',
      label: 'Nombre',
      cellClass: 'font-medium text-slate-900',
      format: (product) => product.i18n?.es?.name || product.nameKey || '—',
    },
    {
      key: 'category',
      label: 'Categoría',
      cellClass: 'text-slate-600',
      format: (product) => product.category || '—',
    },
    {
      key: 'price',
      label: 'Precio',
      format: (product) => formatEuro(product.price),
    },
    {
      key: 'profesionalPrice',
      label: 'Precio profesional',
      cellClass: 'text-slate-600',
      format: (product) =>
        product.profesionalPrice != null ? formatEuro(product.profesionalPrice) : '—',
    },
    {
      key: 'sortOrder',
      label: 'Orden',
      cellClass: 'text-slate-600',
      format: (product) => product.sortOrder,
    },
    {
      key: 'active',
      label: 'Activo',
      cellClass: 'text-slate-600',
      format: (product) => (product.active ? 'Sí' : 'No'),
    },
    {
      key: 'slug',
      label: 'Slug',
      cellClass: 'max-w-xs truncate text-slate-600',
      format: (product) => product.slug || '—',
    },
  ]);

  ngOnInit(): void {
    this.loadProducts();
  }

  protected onNameFilterChange(event: Event): void {
    this.nameFilter.set((event.target as HTMLInputElement).value);
  }

  protected onCategoryFilterChange(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onSectionFilterChange(event: Event): void {
    this.sectionFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onActiveFilterChange(event: Event): void {
    this.activeFilter.set((event.target as HTMLSelectElement).value as TriFilter);
  }

  protected clearFilters(): void {
    this.nameFilter.set('');
    this.categoryFilter.set('all');
    this.sectionFilter.set('all');
    this.activeFilter.set('all');
  }

  protected openAddForm(): void {
    this.editingProduct.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  protected onProductSubmitted(payload: GourmetProductFormSubmit): void {
    if (payload.id) {
      this.gourmetProductService
        .updateProduct(payload.id, payload.values)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadProducts();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el producto gourmet.'),
        });
      return;
    }

    this.gourmetProductService
      .createProduct(payload.values)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadProducts();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el producto gourmet.'),
      });
  }

  protected deleteProduct(product: Product): void {
    const name = product.i18n?.es?.name || product.nameKey || product.slug;
    const confirmed = confirm(`¿Eliminar el producto gourmet "${name}"?`);

    if (!confirmed) {
      return;
    }

    this.gourmetProductService
      .deleteProduct(product._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadProducts(),
        error: () => this.error.set('No se pudo eliminar el producto gourmet.'),
      });
  }

  protected trackProduct(product: Product): string {
    return product._id;
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.gourmetProductService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          const sorted = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
          this.products.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los productos gourmet.');
        },
      });
  }
}
