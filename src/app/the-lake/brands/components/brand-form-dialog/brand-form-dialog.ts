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

import { Brand } from '../../../../core/models/the-lake/Brand';

export type BrandFormValues = {
  name: string;
  description?: string;
};

export type BrandFormSubmit = {
  uuid?: string;
  values: BrandFormValues;
  logoFile: File | null;
};

type LogoPreview = {
  file: File;
  previewUrl: string;
};

@Component({
  selector: 'app-brand-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './brand-form-dialog.html',
})
export class BrandFormDialog implements OnDestroy {
  readonly brand = input<Brand | null>(null);

  readonly submitted = output<BrandFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly logoPreview = signal<LogoPreview | null>(null);
  protected readonly existingLogoUrl = signal<string | null>(null);
  protected readonly existingLogoBroken = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const brand = this.brand();

      untracked(() => {
        if (brand) {
          this.form.patchValue({
            name: brand.name,
            description: brand.description ?? '',
          });
          this.existingLogoUrl.set(brand.logo ?? null);
        } else {
          this.form.reset({ name: '', description: '' });
          this.existingLogoUrl.set(null);
        }

        this.existingLogoBroken.set(false);
        this.clearLogoPreview();
      });
    });
  }

  ngOnDestroy(): void {
    this.clearLogoPreview();
  }

  protected get isEditing(): boolean {
    return this.brand() !== null;
  }

  protected get hasLogoPreview(): boolean {
    return this.logoPreview() !== null;
  }

  protected get hasExistingLogo(): boolean {
    return this.existingLogoUrl() !== null && !this.existingLogoBroken();
  }

  protected onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file?.type.startsWith('image/')) {
      return;
    }

    this.clearLogoPreview();
    this.logoPreview.set({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    input.value = '';
  }

  protected removeNewLogo(): void {
    this.clearLogoPreview();
  }

  protected removeExistingLogo(): void {
    this.existingLogoUrl.set(null);
    this.existingLogoBroken.set(false);
  }

  protected onExistingLogoError(): void {
    this.existingLogoBroken.set(true);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description } = this.form.getRawValue();
    const brand = this.brand();

    this.submitted.emit({
      uuid: brand?.uuid,
      values: {
        name,
        description: description || undefined,
      },
      logoFile: this.logoPreview()?.file ?? null,
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private clearLogoPreview(): void {
    const preview = this.logoPreview();

    if (preview) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    this.logoPreview.set(null);
  }
}
