import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';

import { Brand } from '../../../../core/models/the-lake/Brand';
import { Category } from '../../../../core/models/the-lake/Category';
import { Product } from '../../../../core/models/the-lake/Product';

export type ProductFormValues = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  brandId: string;
  categoryId: string;
};

export type ProductFormSubmit = {
  uuid?: string;
  values: ProductFormValues;
  imageFiles: File[];
  existingImageUrls: string[];
};

type ImagePreview = {
  file: File;
  previewUrl: string;
};

type CategorySelection = {
  parentCategoryId: string;
  subcategoryId: string;
};

@Component({
  selector: 'app-product-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form-dialog.html',
})
export class ProductFormDialog implements OnDestroy {
  readonly product = input<Product | null>(null);
  readonly brands = input<Brand[]>([]);
  readonly categories = input<Category[]>([]);

  readonly submitted = output<ProductFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly imagePreviews = signal<ImagePreview[]>([]);
  protected readonly existingImages = signal<string[]>([]);
  protected readonly brokenExistingImages = signal<Set<string>>(new Set());

  private lastInitializedProductUuid: string | null = null;
  private categoriesSyncedForProductUuid: string | null = null;

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
    parentCategoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    subcategoryId: new FormControl('', { nonNullable: true }),
  });

  private readonly parentCategoryId = toSignal(
    this.form.controls.parentCategoryId.valueChanges.pipe(
      startWith(this.form.controls.parentCategoryId.value),
    ),
    { initialValue: '' },
  );

  protected readonly availableSubcategories = computed(() => {
    const parent = this.categories().find((category) => category.uuid === this.parentCategoryId());
    return parent?.children ?? [];
  });

  protected readonly hasSubcategories = computed(() => this.availableSubcategories().length > 0);

  constructor() {
    effect(() => {
      const product = this.product();
      const categories = this.categories();
      const productUuid = product?.uuid ?? null;
      const productChanged = productUuid !== this.lastInitializedProductUuid;

      untracked(() => {
        if (product) {
          const categorySelection = this.resolveCategorySelection(product.categoryId, categories);

          if (productChanged) {
            this.form.patchValue({
              name: product.name,
              description: product.description ?? '',
              price: Number(product.price),
              stock: Number(product.stock),
              brandId: product.brandId,
              parentCategoryId: categorySelection.parentCategoryId,
              subcategoryId: categorySelection.subcategoryId,
            });
            this.existingImages.set([...product.images]);
            this.brokenExistingImages.set(new Set());
            this.clearNewImagePreviews();
            this.lastInitializedProductUuid = productUuid;
            this.categoriesSyncedForProductUuid = null;
          } else if (
            categories.length > 0 &&
            this.categoriesSyncedForProductUuid !== productUuid
          ) {
            this.form.patchValue(
              {
                parentCategoryId: categorySelection.parentCategoryId,
                subcategoryId: categorySelection.subcategoryId,
              },
              { emitEvent: false },
            );
            this.categoriesSyncedForProductUuid = productUuid;
          }

          this.updateSubcategoryValidators();
        } else if (productChanged) {
          this.form.reset({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            brandId: '',
            parentCategoryId: '',
            subcategoryId: '',
          });
          this.existingImages.set([]);
          this.brokenExistingImages.set(new Set());
          this.clearNewImagePreviews();
          this.lastInitializedProductUuid = null;
          this.categoriesSyncedForProductUuid = null;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.clearNewImagePreviews();
  }

  protected get isEditing(): boolean {
    return this.product() !== null;
  }

  protected onParentCategoryChange(): void {
    this.form.controls.subcategoryId.setValue('');
    this.updateSubcategoryValidators(true);
  }

  protected isExistingImageBroken(url: string): boolean {
    return this.brokenExistingImages().has(url);
  }

  protected onExistingImageError(url: string): void {
    this.brokenExistingImages.update((broken) => new Set(broken).add(url));
  }

  protected removeExistingImage(index: number): void {
    this.existingImages.update((images) => images.filter((_, itemIndex) => itemIndex !== index));
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files?.length) {
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (!imageFiles.length) {
      return;
    }

    const newPreviews = imageFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    this.imagePreviews.update((current) => [...current, ...newPreviews]);
    input.value = '';
  }

  protected removeNewImage(index: number): void {
    this.imagePreviews.update((current) => {
      const preview = current[index];

      if (preview) {
        URL.revokeObjectURL(preview.previewUrl);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    this.updateSubcategoryValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description, price, stock, brandId, parentCategoryId, subcategoryId } =
      this.form.getRawValue();
    const product = this.product();
    const categoryId = this.resolveProductCategoryId(parentCategoryId, subcategoryId);

    this.submitted.emit({
      uuid: product?.uuid,
      values: {
        name,
        description: description || undefined,
        price,
        stock,
        brandId,
        categoryId,
      },
      imageFiles: this.imagePreviews().map((preview) => preview.file),
      existingImageUrls: this.existingImages(),
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private resolveProductCategoryId(parentCategoryId: string, subcategoryId: string): string {
    return subcategoryId || parentCategoryId;
  }

  private resolveCategorySelection(categoryId: string, categories: Category[]): CategorySelection {
    const match = this.findCategoryInTree(categoryId, categories);

    if (!match) {
      return { parentCategoryId: categoryId, subcategoryId: '' };
    }

    if (match.parent) {
      return {
        parentCategoryId: match.parent.uuid,
        subcategoryId: match.category.uuid,
      };
    }

    return {
      parentCategoryId: match.category.uuid,
      subcategoryId: '',
    };
  }

  private findCategoryInTree(
    categoryId: string,
    categories: Category[],
    parent: Category | null = null,
  ): { parent: Category | null; category: Category } | null {
    for (const category of categories) {
      if (category.uuid === categoryId) {
        return { parent, category };
      }

      for (const child of category.children ?? []) {
        if (child.uuid === categoryId) {
          return { parent: category, category: child };
        }
      }

      if (category.children?.length) {
        const match = this.findCategoryInTree(categoryId, category.children, category);
        if (match) {
          return match;
        }
      }
    }

    return null;
  }

  private updateSubcategoryValidators(resetSubcategory = false): void {
    const parentId = this.form.controls.parentCategoryId.value;
    const parent = this.categories().find((category) => category.uuid === parentId);
    const hasChildren = (parent?.children?.length ?? 0) > 0;
    const subcategoryControl = this.form.controls.subcategoryId;

    if (hasChildren) {
      subcategoryControl.setValidators([Validators.required]);
    } else {
      subcategoryControl.clearValidators();

      if (resetSubcategory) {
        subcategoryControl.setValue('');
      }
    }

    subcategoryControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearNewImagePreviews(): void {
    for (const preview of this.imagePreviews()) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    this.imagePreviews.set([]);
  }
}
