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

      untracked(() => {
        if (product) {
          const categorySelection = this.resolveCategorySelection(product.categoryId, categories);

          this.form.patchValue({
            name: product.name,
            description: product.description ?? '',
            price: product.price,
            stock: product.stock,
            brandId: product.brandId,
            parentCategoryId: categorySelection.parentCategoryId,
            subcategoryId: categorySelection.subcategoryId,
          });
          this.existingImages.set([...product.images]);
        } else {
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
        }

        this.updateSubcategoryValidators();
        this.brokenExistingImages.set(new Set());
        this.clearNewImagePreviews();
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
    this.updateSubcategoryValidators();
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
    const categoryId = subcategoryId || parentCategoryId;

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

      if (category.children?.length) {
        const match = this.findCategoryInTree(categoryId, category.children, category);
        if (match) {
          return match;
        }
      }
    }

    return null;
  }

  private updateSubcategoryValidators(): void {
    const parentId = this.form.controls.parentCategoryId.value;
    const parent = this.categories().find((category) => category.uuid === parentId);
    const hasChildren = (parent?.children?.length ?? 0) > 0;
    const subcategoryControl = this.form.controls.subcategoryId;

    if (hasChildren) {
      subcategoryControl.setValidators([Validators.required]);
    } else {
      subcategoryControl.clearValidators();
      subcategoryControl.setValue('');
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
