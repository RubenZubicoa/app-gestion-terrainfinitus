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

import { NewsLetterSubscription } from '../../../../core/models/the-lake/NewsLetterSubscription';

export type NewsLetterSubscriptionFormSubmit = {
  uuid?: string;
  email: string;
};

@Component({
  selector: 'app-newsletter-subscription-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-subscription-form-dialog.html',
})
export class NewsLetterSubscriptionFormDialog {
  readonly subscription = input<NewsLetterSubscription | null>(null);

  readonly submitted = output<NewsLetterSubscriptionFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly showValidationSummary = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor() {
    effect(() => {
      const subscription = this.subscription();

      untracked(() => {
        this.showValidationSummary.set(false);

        if (subscription) {
          this.form.patchValue({ email: subscription.email });
        } else {
          this.form.reset({ email: '' });
        }
      });
    });
  }

  protected get isEditing(): boolean {
    return this.subscription() !== null;
  }

  protected fieldError(controlName: 'email'): string | null {
    const control = this.form.controls[controlName];

    if (!control || !this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'Introduce un correo electrónico válido.';
    }

    return 'Revisa este campo.';
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    this.submitted.emit({
      uuid: this.subscription()?.uuid,
      email: this.form.controls.email.getRawValue().trim(),
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
  }
}
