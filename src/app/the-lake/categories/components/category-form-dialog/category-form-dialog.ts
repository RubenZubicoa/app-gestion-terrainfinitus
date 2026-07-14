import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
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
};

export type CategoryFormContext =
  | { mode: 'parent'; category: Category | null }
  | { mode: 'subcategory'; category: Category | null; parentCategory: Category | null };

export type CategoryFormSubmit =
  | {
      mode: 'parent';
      uuid?: string;
      values: { label: string; description?: string };
      subcategories: SubcategoryFormItem[];
    }
  | {
      mode: 'subcategory';
      uuid?: string;
      parentUuid: string;
      values: { label: string; description?: string };
    };

@Component({
  selector: 'app-category-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './category-form-dialog.html',
})
export class CategoryFormDialog {
  readonly context = input.required<CategoryFormContext>();
  readonly parentCategories = input<Category[]>([]);

  readonly submitted = output<CategoryFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly subcategories = signal<SubcategoryFormItem[]>([]);

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
            this.subcategories.set(
              (category.children ?? []).map((child) => ({
                uuid: child.uuid,
                label: child.label,
                description: child.description ?? '',
              })),
            );
          } else {
            this.form.reset({ label: '', description: '', parentCategoryId: '' });
            this.subcategories.set([]);
          }
        } else {
          const category = formContext.category;
          const parentCategory = formContext.parentCategory;

          this.form.controls.parentCategoryId.setValidators([Validators.required]);
          this.form.controls.parentCategoryId.updateValueAndValidity({ emitEvent: false });
          this.subcategories.set([]);

          if (category) {
            this.form.patchValue({
              label: category.label,
              description: category.description ?? '',
              parentCategoryId: parentCategory?.uuid ?? '',
            });
          } else {
            this.form.reset({
              label: '',
              description: '',
              parentCategoryId: parentCategory?.uuid ?? '',
            });
          }
        }
      });
    });
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
    this.subcategories.update((items) => [...items, { label: '', description: '' }]);
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
    this.subcategories.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { label, description, parentCategoryId } = this.form.getRawValue();
    const formContext = this.context();

    if (formContext.mode === 'parent') {
      this.submitted.emit({
        mode: 'parent',
        uuid: formContext.category?.uuid,
        values: {
          label,
          description: description || undefined,
        },
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
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
