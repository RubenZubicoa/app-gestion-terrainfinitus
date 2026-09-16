import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { Brand } from '../../../../core/models/the-lake/Brand';
import { Category } from '../../../../core/models/the-lake/Category';
import { Product } from '../../../../core/models/the-lake/Product';
import { BrandService } from '../../../../core/services/the-lake/brand';
import { CategoryService } from '../../../../core/services/the-lake/category';
import { LabelPrintService } from '../../../../core/services/the-lake/label-print.service';
import { ProductService } from '../../../../core/services/the-lake/product';
import { formatEuro } from '../../../../shared/utils/currency';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import { ProductFormDialog, ProductFormSubmit } from '../../components/product-form-dialog/product-form-dialog';
import { PrintLabelDialog } from '../../components/print-label-dialog/print-label-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type TriFilter = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, ProductFormDialog, PrintLabelDialog],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly labelPrintService = inject(LabelPrintService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly brands = signal<Brand[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly showPrintLabelDialog = signal(false);
  protected readonly printingProduct = signal<Product | null>(null);
  protected readonly printingLabel = signal(false);

  protected readonly nameFilter = signal('');
  protected readonly brandFilter = signal('all');
  protected readonly categoryFilter = signal('all');
  protected readonly offerFilter = signal<TriFilter>('all');
  protected readonly featuredFilter = signal<TriFilter>('all');

  protected readonly triFilterOptions: { value: TriFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'yes', label: 'Sí' },
    { value: 'no', label: 'No' },
  ];

  private readonly brandMap = computed(() => {
    const map = new Map<string, string>();
    for (const brand of this.brands()) {
      map.set(brand.uuid, brand.name);
    }
    return map;
  });

  private readonly categoryMap = computed(() => {
    const map = new Map<string, string>();

    const addCategory = (category: Category, parentLabel?: string): void => {
      const label = parentLabel ? `${parentLabel} › ${category.label}` : category.label;
      map.set(category.uuid, label);

      for (const child of category.children ?? []) {
        addCategory(child, category.label);
      }
    };

    for (const category of this.categories()) {
      addCategory(category);
    }

    return map;
  });

  protected readonly categoryFilterOptions = computed(() => {
    const options: { value: string; label: string }[] = [{ value: 'all', label: 'Todas' }];

    for (const category of this.categories()) {
      options.push({ value: category.uuid, label: category.label });

      for (const child of category.children ?? []) {
        options.push({
          value: child.uuid,
          label: `${category.label} › ${child.label}`,
        });
      }
    }

    return options;
  });

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.nameFilter().trim() !== '' ||
      this.brandFilter() !== 'all' ||
      this.categoryFilter() !== 'all' ||
      this.offerFilter() !== 'all' ||
      this.featuredFilter() !== 'all'
    );
  });

  protected readonly filteredProducts = computed(() => {
    const name = this.nameFilter().trim().toLowerCase();
    const brandId = this.brandFilter();
    const categoryId = this.categoryFilter();
    const offer = this.offerFilter();
    const featured = this.featuredFilter();
    const categories = this.categories();

    return this.products().filter((product) => {
      if (name && !product.name.toLowerCase().includes(name)) {
        return false;
      }

      if (brandId !== 'all' && product.brandId !== brandId) {
        return false;
      }

      if (
        categoryId !== 'all' &&
        !this.matchesCategoryFilter(product.categoryId, categoryId, categories)
      ) {
        return false;
      }

      if (offer === 'yes' && product.isInOffer !== true) {
        return false;
      }

      if (offer === 'no' && product.isInOffer === true) {
        return false;
      }

      if (featured === 'yes' && !product.isFeatured) {
        return false;
      }

      if (featured === 'no' && product.isFeatured) {
        return false;
      }

      return true;
    });
  });

  protected readonly tableColumns = computed<DataTableColumn<Product>[]>(() => {
    const brandMap = this.brandMap();
    const categoryMap = this.categoryMap();

    return [
      {
        key: 'name',
        label: 'Nombre',
        cellClass: 'font-medium text-slate-900',
        format: (product) => product.name,
      },
      {
        key: 'description',
        label: 'Descripción',
        cellClass: 'max-w-xs truncate text-slate-600',
        format: (product) => product.description || '—',
      },
      {
        key: 'price',
        label: 'Precio',
        format: (product) => formatEuro(product.price),
      },
      {
        key: 'professionalPrice',
        label: 'Precio profesional',
        cellClass: 'text-slate-600',
        format: (product) =>
          product.professionalPrice != null ? formatEuro(product.professionalPrice) : '—',
      },
      {
        key: 'offer',
        label: 'Oferta',
        cellClass: 'text-slate-600',
        format: (product) =>
          product.offerPrice != null ? formatEuro(product.offerPrice) : '—',
      },
      {
        key: 'featured',
        label: 'Destacado',
        cellClass: 'text-slate-600',
        format: (product) => (product.isFeatured ? 'Sí' : 'No'),
      },
      {
        key: 'stock',
        label: 'Stock',
        format: (product) => product.stock,
      },
      {
        key: 'brand',
        label: 'Marca',
        cellClass: 'text-slate-600',
        format: (product) => brandMap.get(product.brandId) ?? product.brandId,
      },
      {
        key: 'category',
        label: 'Categoría',
        cellClass: 'text-slate-600',
        format: (product) => categoryMap.get(product.categoryId) ?? product.categoryId,
      },
      {
        key: 'images',
        label: 'Imágenes',
        cellClass: 'text-slate-600',
        format: (product) => product.images.length,
      },
    ];
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected onNameFilterChange(event: Event): void {
    this.nameFilter.set((event.target as HTMLInputElement).value);
  }

  protected onBrandFilterChange(event: Event): void {
    this.brandFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onCategoryFilterChange(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onOfferFilterChange(event: Event): void {
    this.offerFilter.set((event.target as HTMLSelectElement).value as TriFilter);
  }

  protected onFeaturedFilterChange(event: Event): void {
    this.featuredFilter.set((event.target as HTMLSelectElement).value as TriFilter);
  }

  protected clearFilters(): void {
    this.nameFilter.set('');
    this.brandFilter.set('all');
    this.categoryFilter.set('all');
    this.offerFilter.set('all');
    this.featuredFilter.set('all');
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

  protected openPrintLabelDialog(product: Product): void {
    this.printingProduct.set(product);
    this.showPrintLabelDialog.set(true);
  }

  protected closePrintLabelDialog(): void {
    if (this.printingLabel()) {
      return;
    }

    this.showPrintLabelDialog.set(false);
    this.printingProduct.set(null);
  }

  protected onPrintLabelConfirmed(product: Product): void {
    if (this.printingLabel()) {
      return;
    }

    this.printingLabel.set(true);
    this.error.set(null);

    this.labelPrintService
      .printProductLabel(product)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.printingLabel.set(false);
          this.closePrintLabelDialog();
        },
        error: () => {
          this.printingLabel.set(false);
          this.error.set(
            'No se pudo imprimir la etiqueta. Revisa la conexión con la impresora Zebra.',
          );
          this.closePrintLabelDialog();
        },
      });
  }

  protected onProductSubmitted(payload: ProductFormSubmit): void {
    if (payload.uuid) {
      this.productService
        .updateProduct(
          payload.uuid,
          {
            name: payload.values.name,
            description: payload.values.description,
            price: payload.values.price,
            stock: payload.values.stock,
            brandId: payload.values.brandId,
            categoryId: payload.values.categoryId,
            isFeatured: payload.values.isFeatured,
            professionalPrice:
              payload.values.professionalPrice != null
                ? payload.values.professionalPrice
                : null,
            ...(payload.values.isInOffer === true
              ? {
                  isInOffer: true as const,
                  offerPrice: payload.values.offerPrice,
                }
              : {
                  isInOffer: null,
                  offerPrice: null,
                }),
            existingImages: payload.existingImageUrls,
          },
          payload.imageFiles,
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadProducts();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el producto.'),
        });
      return;
    }

    this.productService
      .createProduct(
        {
          name: payload.values.name,
          description: payload.values.description,
          price: payload.values.price,
          stock: payload.values.stock,
          brandId: payload.values.brandId,
          categoryId: payload.values.categoryId,
          isFeatured: payload.values.isFeatured,
          ...(payload.values.professionalPrice != null
            ? { professionalPrice: payload.values.professionalPrice }
            : {}),
          ...(payload.values.isInOffer === true
            ? {
                isInOffer: true,
                offerPrice: payload.values.offerPrice,
              }
            : {}),
        },
        payload.imageFiles,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadProducts();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el producto.'),
      });
  }

  protected deleteProduct(product: Product): void {
    const confirmed = confirm(`¿Eliminar el producto "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    this.productService.deleteProduct(product.uuid).subscribe({
      next: () => this.loadProducts(),
      error: () => this.error.set('No se pudo eliminar el producto.'),
    });
  }

  protected trackProduct(product: Product): string {
    return product.uuid;
  }

  private matchesCategoryFilter(
    productCategoryId: string,
    filterCategoryId: string,
    categories: Category[],
  ): boolean {
    if (productCategoryId === filterCategoryId) {
      return true;
    }

    const parent = categories.find((category) => category.uuid === filterCategoryId);

    if (!parent) {
      return false;
    }

    return (parent.children ?? []).some((child) => child.uuid === productCategoryId);
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los productos.');
      },
    });

    this.brandService.getBrands().subscribe({
      next: (brands) => this.brands.set(brands),
    });

    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => this.error.set('No se pudieron cargar los productos.'),
    });
  }
}
