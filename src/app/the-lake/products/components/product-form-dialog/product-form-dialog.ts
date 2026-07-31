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
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  isFeatured: boolean;
  isInOffer?: boolean;
  offerPrice?: number;
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
  protected readonly showValidationSummary = signal(false);

  private lastInitializedProductUuid: string | null = null;
  private categoriesSyncedForProductUuid: string | null = null;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    stock: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    brandId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    parentCategoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    subcategoryId: new FormControl('', { nonNullable: true }),
    isFeatured: new FormControl(false, { nonNullable: true }),
    isInOffer: new FormControl(false, { nonNullable: true }),
    offerPrice: new FormControl<number | null>(null),
  });

  private readonly parentCategoryId = toSignal(
    this.form.controls.parentCategoryId.valueChanges.pipe(
      startWith(this.form.controls.parentCategoryId.value),
    ),
    { initialValue: '' },
  );

  private readonly isInOffer = toSignal(
    this.form.controls.isInOffer.valueChanges.pipe(startWith(this.form.controls.isInOffer.value)),
    { initialValue: false },
  );

  protected readonly availableSubcategories = computed(() => {
    const parent = this.categories().find((category) => category.uuid === this.parentCategoryId());
    return parent?.children ?? [];
  });

  protected readonly hasSubcategories = computed(() => this.availableSubcategories().length > 0);

  protected readonly showOfferPrice = computed(() => this.isInOffer());

  constructor() {
    effect(() => {
      const inOffer = this.isInOffer();

      untracked(() => {
        this.updateOfferPriceValidators(!inOffer);
      });
    });

    effect(() => {
      const product = this.product();
      const categories = this.categories();
      const productUuid = product?.uuid ?? null;
      const productChanged = productUuid !== this.lastInitializedProductUuid;

      untracked(() => {
        this.showValidationSummary.set(false);

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
              isFeatured: product.isFeatured ?? false,
              isInOffer: product.isInOffer === true,
              offerPrice:
                product.isInOffer === true && product.offerPrice != null
                  ? Number(product.offerPrice)
                  : null,
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
            price: null,
            stock: null,
            brandId: '',
            parentCategoryId: '',
            subcategoryId: '',
            isFeatured: false,
            isInOffer: false,
            offerPrice: null,
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

  protected fieldError(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];

    if (!control || !this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'El valor no puede ser negativo.';
    }

    return 'Revisa este campo.';
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
    this.updateOfferPriceValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    const {
      name,
      description,
      price,
      stock,
      brandId,
      parentCategoryId,
      subcategoryId,
      isFeatured,
      isInOffer,
      offerPrice,
    } = this.form.getRawValue();
    const product = this.product();
    const categoryId = this.resolveProductCategoryId(parentCategoryId, subcategoryId);

    this.submitted.emit({
      uuid: product?.uuid,
      values: {
        name,
        description: description || undefined,
        price: Number(price),
        stock: Number(stock),
        brandId,
        categoryId,
        isFeatured: Boolean(isFeatured),
        ...(isInOffer && offerPrice != null
          ? { isInOffer: true as const, offerPrice: Number(offerPrice) }
          : {}),
      },
      imageFiles: this.imagePreviews().map((preview) => preview.file),
      existingImageUrls: this.existingImages(),
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
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

  private updateOfferPriceValidators(resetOfferPrice = false): void {
    const offerPriceControl = this.form.controls.offerPrice;
    const isInOffer = this.form.controls.isInOffer.value;

    if (isInOffer) {
      offerPriceControl.setValidators([Validators.required, Validators.min(0)]);
    } else {
      offerPriceControl.clearValidators();

      if (resetOfferPrice) {
        offerPriceControl.setValue(null, { emitEvent: false });
      }
    }

    offerPriceControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearNewImagePreviews(): void {
    for (const preview of this.imagePreviews()) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    this.imagePreviews.set([]);
  }
}
