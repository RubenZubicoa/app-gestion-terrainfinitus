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

import { NewsLetter } from '../../../../core/models/the-lake/NewsLetter';

export type NewsLetterFormValues = {
  title: string;
};

export type NewsLetterFormSubmit = {
  uuid?: string;
  values: NewsLetterFormValues;
  pdfFile: File | null;
  imageFile: File | null;
};

type ImagePreview = {
  file: File;
  previewUrl: string;
};

@Component({
  selector: 'app-newsletter-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-form-dialog.html',
})
export class NewsLetterFormDialog implements OnDestroy {
  readonly newsLetter = input<NewsLetter | null>(null);

  readonly submitted = output<NewsLetterFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly showValidationSummary = signal(false);
  protected readonly pdfFile = signal<File | null>(null);
  protected readonly imagePreview = signal<ImagePreview | null>(null);
  protected readonly existingPdfPath = signal<string | null>(null);
  protected readonly existingImageUrl = signal<string | null>(null);
  protected readonly existingImageBroken = signal(false);

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const newsLetter = this.newsLetter();

      untracked(() => {
        this.showValidationSummary.set(false);
        this.clearPdfFile();
        this.clearImagePreview();
        this.existingImageBroken.set(false);

        if (newsLetter) {
          this.form.patchValue({ title: newsLetter.title });
          this.existingPdfPath.set(newsLetter.path || null);
          this.existingImageUrl.set(newsLetter.pathImage ?? null);
        } else {
          this.form.reset({ title: '' });
          this.existingPdfPath.set(null);
          this.existingImageUrl.set(null);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.clearImagePreview();
  }

  protected get isEditing(): boolean {
    return this.newsLetter() !== null;
  }

  protected get hasImagePreview(): boolean {
    return this.imagePreview() !== null;
  }

  protected get hasExistingImage(): boolean {
    return this.existingImageUrl() !== null && !this.existingImageBroken();
  }

  protected get pdfFileName(): string | null {
    return this.pdfFile()?.name ?? null;
  }

  protected fieldError(controlName: 'title'): string | null {
    const control = this.form.controls[controlName];

    if (!control || !(control.touched || this.showValidationSummary()) || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    return 'Revisa este campo.';
  }

  protected onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || file.type !== 'application/pdf') {
      return;
    }

    this.pdfFile.set(file);
    input.value = '';
  }

  protected removePdfFile(): void {
    this.clearPdfFile();
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
      this.showValidationSummary.set(true);
      return;
    }

    const newsLetter = this.newsLetter();
    const pdf = this.pdfFile();

    if (!newsLetter && !pdf) {
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    this.submitted.emit({
      uuid: newsLetter?.uuid,
      values: {
        title: this.form.controls.title.getRawValue().trim(),
      },
      pdfFile: pdf,
      imageFile: this.imagePreview()?.file ?? null,
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private clearPdfFile(): void {
    this.pdfFile.set(null);
  }

  private clearImagePreview(): void {
    const preview = this.imagePreview();

    if (preview) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    this.imagePreview.set(null);
  }
}
