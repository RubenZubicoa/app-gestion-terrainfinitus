import { CurrencyPipe } from '@angular/common';
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
import { ProductService } from '../../../../core/services/the-lake/product';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import { ProductFormDialog, ProductFormSubmit } from '../../components/product-form-dialog/product-form-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, ProductFormDialog],
  providers: [CurrencyPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly brands = signal<Brand[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);

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
        format: (product) => this.currencyPipe.transform(product.price, 'EUR') ?? '',
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
            categoryId: payload.values.category,
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
          categoryId: payload.values.category,
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
