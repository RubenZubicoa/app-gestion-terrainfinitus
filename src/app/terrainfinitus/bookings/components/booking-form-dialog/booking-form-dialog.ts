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

import {
  BOOKING_PAYMENT_METHOD_LABELS,
  BOOKING_PAYMENT_METHODS,
  BOOKING_PAYMENT_STATUS_LABELS,
  BOOKING_PAYMENT_STATUS_OPTIONS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
  Booking,
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  CreateBooking,
} from '../../../../core/models/terrainfinitus/Booking';

export type BookingFormSubmit = {
  uuid?: string;
  values: CreateBooking;
};

@Component({
  selector: 'app-booking-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './booking-form-dialog.html',
})
export class BookingFormDialog {
  readonly booking = input<Booking | null>(null);

  readonly submitted = output<BookingFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly showValidationSummary = signal(false);

  protected readonly statusOptions = BOOKING_STATUS_OPTIONS;
  protected readonly statusLabels = BOOKING_STATUS_LABELS;
  protected readonly paymentStatusOptions = BOOKING_PAYMENT_STATUS_OPTIONS;
  protected readonly paymentStatusLabels = BOOKING_PAYMENT_STATUS_LABELS;
  protected readonly paymentMethods = BOOKING_PAYMENT_METHODS;
  protected readonly paymentMethodLabels = BOOKING_PAYMENT_METHOD_LABELS;

  protected readonly form = new FormGroup({
    userId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    roomId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    guests: new FormControl<number | null>(1, {
      validators: [Validators.required, Validators.min(1)],
    }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    currency: new FormControl('EUR', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<BookingStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentMethod: new FormControl<BookingPaymentMethod>('card', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentStatus: new FormControl<BookingPaymentStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const booking = this.booking();

      untracked(() => {
        this.showValidationSummary.set(false);

        if (booking) {
          this.form.patchValue({
            userId: booking.userId,
            roomId: booking.roomId,
            startDate: this.toDateInputValue(booking.startDate),
            endDate: this.toDateInputValue(booking.endDate),
            guests: booking.guests,
            price: booking.price,
            currency: booking.currency || 'EUR',
            status: booking.status,
            paymentMethod: this.normalizePaymentMethod(booking.paymentMethod),
            paymentStatus: booking.paymentStatus,
            paymentDate: this.toDateInputValue(booking.paymentDate),
          });
        } else {
          const today = this.toDateInputValue(new Date());
          this.form.reset({
            userId: '',
            roomId: '',
            startDate: today,
            endDate: today,
            guests: 1,
            price: null,
            currency: 'EUR',
            status: 'pending',
            paymentMethod: 'card',
            paymentStatus: 'pending',
            paymentDate: today,
          });
        }
      });
    });
  }

  protected get isEditing(): boolean {
    return this.booking() !== null;
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
      return 'El valor no es válido.';
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

    const raw = this.form.getRawValue();
    const startDate = new Date(raw.startDate);
    const endDate = new Date(raw.endDate);

    if (endDate < startDate) {
      this.form.controls.endDate.setErrors({ min: true });
      this.form.controls.endDate.markAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    this.submitted.emit({
      uuid: this.booking()?.uuid,
      values: {
        userId: raw.userId.trim(),
        roomId: raw.roomId.trim(),
        startDate,
        endDate,
        guests: Number(raw.guests),
        price: Number(raw.price),
        currency: raw.currency.trim() || 'EUR',
        status: raw.status,
        paymentMethod: raw.paymentMethod,
        paymentStatus: raw.paymentStatus,
        paymentDate: new Date(raw.paymentDate),
      },
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private toDateInputValue(value: Date | string | undefined | null): string {
    const date = value instanceof Date ? value : value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizePaymentMethod(method: string): BookingPaymentMethod {
    return (BOOKING_PAYMENT_METHODS as readonly string[]).includes(method)
      ? (method as BookingPaymentMethod)
      : 'card';
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
  }
}
