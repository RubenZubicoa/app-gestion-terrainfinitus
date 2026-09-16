import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Product } from '../../../../core/models/the-lake/Product';

@Component({
  selector: 'app-print-label-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './print-label-dialog.html',
})
export class PrintLabelDialog {
  readonly product = input.required<Product>();
  readonly printing = input(false);

  readonly confirmed = output<Product>();
  readonly cancelled = output<void>();

  protected onConfirm(): void {
    if (this.printing()) {
      return;
    }

    this.confirmed.emit(this.product());
  }

  protected onCancel(): void {
    if (this.printing()) {
      return;
    }

    this.cancelled.emit();
  }
}
