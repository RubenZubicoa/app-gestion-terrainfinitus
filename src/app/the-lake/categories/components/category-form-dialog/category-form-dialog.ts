import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category } from '../../../../core/models/the-lake/Category';

export type SubcategoryFormItem = {
  uuid?: string;
  label: string;
  description: string;
  existingImageUrl: string | null;
  imageFile: File | null;
  previewUrl: string | null;
  imageBroken: boolean;
};

export type CategoryFormContext =
  | { mode: 'parent'; category: Category | null }
  | { mode: 'subcategory'; category: Category | null; parentCategory: Category | null };

export type CategoryFormSubmit =
  | {
      mode: 'parent';
      uuid?: string;
      values: { label: string; description?: string };
      imageFile: File | null;
      subcategories: SubcategoryFormItem[];
    }
  | {
      mode: 'subcategory';
      uuid?: string;
      parentUuid: string;
      values: { label: string; description?: string };
      imageFile: File | null;
      existingImageUrl: string | null;
    };

type ImagePreview = {
  file: File;
  previewUrl: string;
};

@Component({
  selector: 'app-category-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './category-form-dialog.html',
})
export class CategoryFormDialog implements OnDestroy {
  readonly context = input.required<CategoryFormContext>();
  readonly parentCategories = input<Category[]>([]);

  readonly submitted = output<CategoryFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly subcategories = signal<SubcategoryFormItem[]>([]);
  protected readonly imagePreview = signal<ImagePreview | null>(null);
  protected readonly existingImageUrl = signal<string | null>(null);
  protected readonly existingImageBroken = signal(false);

  protected readonly form = new FormGroup({
    label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    parentCategoryId: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const formContext = this.context();

      untracked(() => {
        if (formContext.mode === 'parent') {
          const category = formContext.category;

          this.form.controls.parentCategoryId.clearValidators();
          this.form.controls.parentCategoryId.updateValueAndValidity({ emitEvent: false });

          if (category) {
            this.form.patchValue({
              label: category.label,
              description: category.description ?? '',
              parentCategoryId: '',
            });
            this.replaceSubcategories(
              (category.children ?? []).map((child) => this.createSubcategoryItem(child)),
            );
            this.existingImageUrl.set(category.image ?? null);
          } else {
            this.form.reset({ label: '', description: '', parentCategoryId: '' });
            this.replaceSubcategories([]);
            this.existingImageUrl.set(null);
          }
        } else {
          const category = formContext.category;
          const parentCategory = formContext.parentCategory;

          this.form.controls.parentCategoryId.setValidators([Validators.required]);
          this.form.controls.parentCategoryId.updateValueAndValidity({ emitEvent: false });
          this.replaceSubcategories([]);

          if (category) {
            this.form.patchValue({
              label: category.label,
              description: category.description ?? '',
              parentCategoryId: parentCategory?.uuid ?? '',
            });
            this.existingImageUrl.set(category.image ?? null);
          } else {
            this.form.reset({
              label: '',
              description: '',
              parentCategoryId: parentCategory?.uuid ?? '',
            });
            this.existingImageUrl.set(null);
          }
        }

        this.existingImageBroken.set(false);
        this.clearImagePreview();
      });
    });
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
    this.clearSubcategoryPreviews(this.subcategories());
  }

  protected get isEditing(): boolean {
    return this.context().category !== null;
  }

  protected get isParentMode(): boolean {
    return this.context().mode === 'parent';
  }

  protected get dialogTitle(): string {
    if (this.isParentMode) {
      return this.isEditing ? 'Editar categoría' : 'Agregar categoría';
    }

    return this.isEditing ? 'Editar subcategoría' : 'Agregar subcategoría';
  }

  protected get submitLabel(): string {
    if (this.isParentMode) {
      return this.isEditing ? 'Guardar cambios' : 'Agregar categoría';
    }

    return this.isEditing ? 'Guardar cambios' : 'Agregar subcategoría';
  }

  protected addSubcategory(): void {
    this.subcategories.update((items) => [...items, this.createSubcategoryItem()]);
  }

  protected updateSubcategoryLabel(index: number, value: string): void {
    this.subcategories.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, label: value } : item)),
    );
  }

  protected updateSubcategoryDescription(index: number, value: string): void {
    this.subcategories.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, description: value } : item,
      ),
    );
  }

  protected removeSubcategory(index: number): void {
    this.subcategories.update((items) => {
      const removed = items[index];

      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return items.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  protected hasSubcategoryExistingImage(item: SubcategoryFormItem): boolean {
    return item.existingImageUrl !== null && !item.imageBroken;
  }

  protected hasSubcategoryImagePreview(item: SubcategoryFormItem): boolean {
    return item.previewUrl !== null;
  }

  protected onSubcategoryImageSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file?.type.startsWith('image/')) {
      return;
    }

    this.subcategories.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }

        return {
          ...item,
          imageFile: file,
          previewUrl: URL.createObjectURL(file),
        };
      }),
    );
    input.value = '';
  }

  protected removeSubcategoryNewImage(index: number): void {
    this.subcategories.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }

        return {
          ...item,
          imageFile: null,
          previewUrl: null,
        };
      }),
    );
  }

  protected removeSubcategoryExistingImage(index: number): void {
    this.subcategories.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, existingImageUrl: null, imageBroken: false } : item,
      ),
    );
  }

  protected onSubcategoryExistingImageError(index: number): void {
    this.subcategories.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, imageBroken: true } : item)),
    );
  }

  protected get hasImagePreview(): boolean {
    return this.imagePreview() !== null;
  }

  protected get hasExistingImage(): boolean {
    return this.existingImageUrl() !== null && !this.existingImageBroken();
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file?.type.startsWith('image/')) {
      return;
    }

    this.clearImagePreview();
    this.imagePreview.set({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    input.value = '';
  }

  protected removeNewImage(): void {
    this.clearImagePreview();
  }

  protected removeExistingImage(): void {
    this.existingImageUrl.set(null);
    this.existingImageBroken.set(false);
  }

  protected onExistingImageError(): void {
    this.existingImageBroken.set(true);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { label, description, parentCategoryId } = this.form.getRawValue();
    const formContext = this.context();
    const imageFile = this.imagePreview()?.file ?? null;

    if (formContext.mode === 'parent') {
      this.submitted.emit({
        mode: 'parent',
        uuid: formContext.category?.uuid,
        values: {
          label,
          description: description || undefined,
        },
        imageFile,
        subcategories: this.subcategories().filter((item) => item.label.trim()),
      });
      return;
    }

    this.submitted.emit({
      mode: 'subcategory',
      uuid: formContext.category?.uuid,
      parentUuid: parentCategoryId,
      values: {
        label,
        description: description || undefined,
      },
      imageFile,
      existingImageUrl: this.existingImageUrl(),
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private createSubcategoryItem(child?: Category): SubcategoryFormItem {
    return {
      uuid: child?.uuid,
      label: child?.label ?? '',
      description: child?.description ?? '',
      existingImageUrl: child?.image ?? null,
      imageFile: null,
      previewUrl: null,
      imageBroken: false,
    };
  }

  private replaceSubcategories(items: SubcategoryFormItem[]): void {
    this.clearSubcategoryPreviews(this.subcategories());
    this.subcategories.set(items);
  }

  private clearSubcategoryPreviews(items: SubcategoryFormItem[]): void {
    for (const item of items) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
  }

  private clearImagePreview(): void {
    const preview = this.imagePreview();

    if (preview) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    this.imagePreview.set(null);
  }
}
