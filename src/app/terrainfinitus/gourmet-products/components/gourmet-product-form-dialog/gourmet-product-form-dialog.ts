import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { GourmetProductCreate, Product } from '../../../../core/models/terrainfinitus/GourmetProduct';
import { I18n } from '../../../../core/models/terrainfinitus/i18n';

export type GourmetProductFormSubmit = {
  id?: string;
  values: GourmetProductCreate;
};

const I18N_LOCALES = ['es', 'en', 'de', 'fr', 'it', 'pt', 'jp'] as const;
type I18nLocale = (typeof I18N_LOCALES)[number];

@Component({
  selector: 'app-gourmet-product-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './gourmet-product-form-dialog.html',
})
export class GourmetProductFormDialog {
  readonly product = input<Product | null>(null);

  readonly submitted = output<GourmetProductFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly showValidationSummary = signal(false);
  protected readonly selectedLocale = signal<I18nLocale>('es');
  protected readonly locales = I18N_LOCALES;

  private readonly localeLabels: Record<I18nLocale, string> = {
    es: 'Español',
    en: 'Inglés',
    de: 'Alemán',
    fr: 'Francés',
    it: 'Italiano',
    pt: 'Portugués',
    jp: 'Japonés',
  };

  protected readonly form = new FormGroup({
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    key: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    sectionId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    sortOrder: new FormControl<number | null>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    profesionalPrice: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    currency: new FormControl('EUR', { nonNullable: true, validators: [Validators.required] }),
    image: new FormControl('', { nonNullable: true }),
    imageUrl: new FormControl('', { nonNullable: true }),
    sourceUrl: new FormControl('', { nonNullable: true }),
    nameKey: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descriptionKey: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    active: new FormControl(true, { nonNullable: true }),
    i18nName: new FormControl('', { nonNullable: true }),
    i18nDescription: new FormControl('', { nonNullable: true }),
  });

  private i18nDraft: I18n = this.createEmptyI18n();

  constructor() {
    effect(() => {
      const product = this.product();

      untracked(() => {
        this.showValidationSummary.set(false);
        this.selectedLocale.set('es');

        if (product) {
          this.i18nDraft = this.cloneI18n(product.i18n);
          this.form.patchValue({
            slug: product.slug,
            key: product.key,
            category: product.category,
            sectionId: product.sectionId,
            sortOrder: product.sortOrder,
            price: product.price,
            profesionalPrice: product.profesionalPrice,
            currency: product.currency || 'EUR',
            image: product.image ?? '',
            imageUrl: product.imageUrl ?? '',
            sourceUrl: product.sourceUrl ?? '',
            nameKey: product.nameKey,
            descriptionKey: product.descriptionKey,
            active: product.active,
            i18nName: product.i18n?.es?.name ?? '',
            i18nDescription: product.i18n?.es?.description ?? '',
          });
        } else {
          this.i18nDraft = this.createEmptyI18n();
          this.form.reset({
            slug: '',
            key: '',
            category: '',
            sectionId: '',
            sortOrder: 0,
            price: null,
            profesionalPrice: null,
            currency: 'EUR',
            image: '',
            imageUrl: '',
            sourceUrl: '',
            nameKey: '',
            descriptionKey: '',
            active: true,
            i18nName: '',
            i18nDescription: '',
          });
        }
      });
    });
  }

  protected get isEditing(): boolean {
    return this.product() !== null;
  }

  protected localeLabel(locale: I18nLocale): string {
    return this.localeLabels[locale];
  }

  protected onLocaleChange(event: Event): void {
    this.persistCurrentLocaleFields();
    const locale = (event.target as HTMLSelectElement).value as I18nLocale;
    this.selectedLocale.set(locale);
    this.form.patchValue(
      {
        i18nName: this.i18nDraft[locale].name,
        i18nDescription: this.i18nDraft[locale].description,
      },
      { emitEvent: false },
    );
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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.persistCurrentLocaleFields();

    if (!this.i18nDraft.es.name.trim()) {
      this.selectedLocale.set('es');
      this.form.patchValue({
        i18nName: this.i18nDraft.es.name,
        i18nDescription: this.i18nDraft.es.description,
      });
      this.form.controls.i18nName.markAsTouched();
      this.form.controls.i18nName.setErrors({ required: true });
      this.showValidationSummary.set(true);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    const raw = this.form.getRawValue();
    const product = this.product();
    const i18n = this.fillMissingLocalesFromSpanish(this.i18nDraft);

    const values: GourmetProductCreate = {
      slug: raw.slug.trim(),
      key: raw.key.trim(),
      category: raw.category.trim(),
      sectionId: raw.sectionId.trim(),
      sortOrder: Number(raw.sortOrder),
      price: Number(raw.price),
      profesionalPrice: Number(raw.profesionalPrice),
      currency: raw.currency.trim() || 'EUR',
      image: raw.image.trim(),
      imageUrl: raw.imageUrl.trim(),
      sourceUrl: raw.sourceUrl.trim(),
      nameKey: raw.nameKey.trim(),
      descriptionKey: raw.descriptionKey.trim(),
      i18n,
      active: Boolean(raw.active),
      exportedAt: product?.exportedAt,
    };

    this.submitted.emit({
      id: product?._id,
      values,
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private persistCurrentLocaleFields(): void {
    const locale = this.selectedLocale();
    this.i18nDraft = {
      ...this.i18nDraft,
      [locale]: {
        name: this.form.controls.i18nName.value.trim(),
        description: this.form.controls.i18nDescription.value.trim(),
      },
    };
  }

  private fillMissingLocalesFromSpanish(i18n: I18n): I18n {
    const fallback = {
      name: i18n.es.name.trim(),
      description: i18n.es.description.trim(),
    };

    const next = { ...i18n };

    for (const locale of I18N_LOCALES) {
      if (!next[locale].name.trim()) {
        next[locale] = { ...fallback };
      }
    }

    return next;
  }

  private createEmptyI18n(): I18n {
    const empty = { name: '', description: '' };
    return {
      es: { ...empty },
      en: { ...empty },
      de: { ...empty },
      fr: { ...empty },
      it: { ...empty },
      pt: { ...empty },
      jp: { ...empty },
    };
  }

  private cloneI18n(i18n: I18n | undefined): I18n {
    const empty = this.createEmptyI18n();

    if (!i18n) {
      return empty;
    }

    return {
      es: { name: i18n.es?.name ?? '', description: i18n.es?.description ?? '' },
      en: { name: i18n.en?.name ?? '', description: i18n.en?.description ?? '' },
      de: { name: i18n.de?.name ?? '', description: i18n.de?.description ?? '' },
      fr: { name: i18n.fr?.name ?? '', description: i18n.fr?.description ?? '' },
      it: { name: i18n.it?.name ?? '', description: i18n.it?.description ?? '' },
      pt: { name: i18n.pt?.name ?? '', description: i18n.pt?.description ?? '' },
      jp: { name: i18n.jp?.name ?? '', description: i18n.jp?.description ?? '' },
    };
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
  }
}
