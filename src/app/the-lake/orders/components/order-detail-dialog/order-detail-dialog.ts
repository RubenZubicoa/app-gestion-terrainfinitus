import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  Order,
  OrderStatus,
} from '../../../../core/models/the-lake/Order';

export type OrderDetailSubmit = {
  uuid: string;
  status: OrderStatus;
};

@Component({
  selector: 'app-order-detail-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './order-detail-dialog.html',
})
export class OrderDetailDialog {
  readonly order = input.required<Order>();

  readonly submitted = output<OrderDetailSubmit>();
  readonly cancelled = output<void>();

  protected readonly statusOptions = ORDER_STATUS_OPTIONS;
  protected readonly statusLabels = ORDER_STATUS_LABELS;

  protected readonly form = new FormGroup({
    status: new FormControl<OrderStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      const order = this.order();

      untracked(() => {
        this.form.patchValue({ status: order.status });
      });
    });
  }

  protected get customerName(): string {
    const order = this.order();
    return `${order.name} ${order.lastName}`.trim();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      uuid: this.order().uuid,
      status: this.form.controls.status.value,
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
