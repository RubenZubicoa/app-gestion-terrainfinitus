import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs';

import { Brand } from '../../../../core/models/the-lake/Brand';
import { Category } from '../../../../core/models/the-lake/Category';
import { Product, ProductCreate, ProductUpdate } from '../../../../core/models/the-lake/Product';
import { ProductService } from '../../../../core/services/the-lake/product';

@Component({
  selector: 'app-product-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form-dialog.html',
})
export class ProductFormDialog {
  private readonly productService = inject(ProductService);

  readonly product = input<Product | null>(null);
  readonly brands = input<Brand[]>([]);
  readonly categories = input<Category[]>([]);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly brokenImages = signal<Set<string>>(new Set());

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    price: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    stock: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    brandId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    images: new FormControl('', { nonNullable: true }),
  });

  protected readonly previewImages = toSignal(
    this.form.controls.images.valueChanges.pipe(
      startWith(this.form.controls.images.value),
      map((value) =>
        value
          .split(',')
          .map((url) => url.trim())
          .filter(Boolean),
      ),
    ),
    { initialValue: [] as string[] },
  );

  constructor() {
    effect(() => {
      const product = this.product();

      if (product) {
        this.form.patchValue({
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          stock: product.stock,
          brandId: product.brandId,
          categoryId: product.categoryId,
          images: product.images.join(', '),
        });
      } else {
        this.form.reset({
          name: '',
          description: '',
          price: 0,
          stock: 0,
          brandId: '',
          categoryId: '',
          images: '',
        });
      }

      this.error.set(null);
      this.brokenImages.set(new Set());
    });

    effect(() => {
      this.previewImages();
      this.brokenImages.set(new Set());
    });
  }

  protected get isEditing(): boolean {
    return this.product() !== null;
  }

  protected isImageBroken(url: string): boolean {
    return this.brokenImages().has(url);
  }

  protected onImageError(url: string): void {
    this.brokenImages.update((broken) => new Set(broken).add(url));
  }

  protected parseImages(value: string): string[] {
    return value
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description, price, stock, brandId, categoryId, images } = this.form.getRawValue();
    const parsedImages = this.parseImages(images);

    this.saving.set(true);
    this.error.set(null);

    const product = this.product();

    if (product) {
      const update: ProductUpdate = {
        name,
        description: description || undefined,
        price,
        stock,
        brandId,
        categoryId,
        images: parsedImages,
      };

      this.productService.updateProduct(product.uuid, update).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('No se pudo actualizar el producto.');
        },
      });
      return;
    }

    const create: ProductCreate = {
      name,
      description: description || undefined,
      price,
      stock,
      brandId,
      categoryId,
      images: parsedImages,
    };

    this.productService.createProduct(create).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No se pudo crear el producto.');
      },
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
