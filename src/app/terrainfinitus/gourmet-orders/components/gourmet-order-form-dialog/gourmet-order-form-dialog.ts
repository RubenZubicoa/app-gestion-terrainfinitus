import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  AddGourmetOrder,
  GOURMET_ORDER_STATUS_LABELS,
  GOURMET_ORDER_STATUS_OPTIONS,
  GourmetOrder,
  GourmetOrderProduct,
  GourmetOrderStatus,
} from '../../../../core/models/terrainfinitus/GourmetOrder';
import { Product } from '../../../../core/models/terrainfinitus/GourmetProduct';

export type GourmetOrderFormSubmit = {
  uuid?: string;
  values: AddGourmetOrder;
};

type ProductLineGroup = FormGroup<{
  productId: FormControl<string>;
  quantity: FormControl<number | null>;
  price: FormControl<number | null>;
}>;

@Component({
  selector: 'app-gourmet-order-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './gourmet-order-form-dialog.html',
})
export class GourmetOrderFormDialog {
  readonly order = input<GourmetOrder | null>(null);
  readonly products = input<Product[]>([]);

  readonly submitted = output<GourmetOrderFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly showValidationSummary = signal(false);
  protected readonly statusOptions = GOURMET_ORDER_STATUS_OPTIONS;
  protected readonly statusLabels = GOURMET_ORDER_STATUS_LABELS;

  protected readonly form = new FormGroup({
    userId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<GourmetOrderStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    products: new FormArray<ProductLineGroup>([]),
  });

  protected getTotalPrice(): number {
    return this.form.controls.products.controls.reduce((sum, line) => {
      const quantity = Number(line.controls.quantity.value ?? 0);
      const price = Number(line.controls.price.value ?? 0);
      return sum + quantity * price;
    }, 0);
  }

  constructor() {
    effect(() => {
      const order = this.order();

      untracked(() => {
        this.showValidationSummary.set(false);
        this.clearProducts();

        if (order) {
          this.form.patchValue({
            userId: order.userId,
            status: order.status,
          });

          for (const product of order.products) {
            this.addProductLine(product);
          }
        } else {
          this.form.reset({
            userId: '',
            status: 'pending',
          });
          this.addProductLine();
        }
      });
    });
  }

  protected get isEditing(): boolean {
    return this.order() !== null;
  }

  protected get productLines(): ProductLineGroup[] {
    return this.form.controls.products.controls;
  }

  protected productLabel(productId: string): string {
    const product = this.products().find((item) => item._id === productId);
    return product?.i18n.es.name || product?.nameKey || productId;
  }

  protected fieldError(controlName: 'userId'): string | null {
    const control = this.form.controls[controlName];

    if (!control || !this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    return 'Revisa este campo.';
  }

  protected lineFieldError(line: ProductLineGroup, field: 'productId' | 'quantity' | 'price'): string | null {
    const control = line.controls[field];

    if (!control || !this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Obligatorio.';
    }

    if (control.hasError('min')) {
      return 'Valor no válido.';
    }

    return 'Revisa este campo.';
  }

  protected addProductLine(product?: GourmetOrderProduct): void {
    const line = new FormGroup({
      productId: new FormControl(product?.productId ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      quantity: new FormControl<number | null>(product?.quantity ?? 1, {
        validators: [Validators.required, Validators.min(1)],
      }),
      price: new FormControl<number | null>(product?.price ?? null, {
        validators: [Validators.required, Validators.min(0)],
      }),
    });

    this.form.controls.products.push(line);
  }

  protected removeProductLine(index: number): void {
    if (this.form.controls.products.length <= 1) {
      return;
    }

    this.form.controls.products.removeAt(index);
  }

  protected onProductSelected(index: number, event: Event): void {
    const productId = (event.target as HTMLSelectElement).value;
    const product = this.products().find((item) => item._id === productId);
    const line = this.form.controls.products.at(index);

    if (!line || !product) {
      return;
    }

    line.patchValue({ price: product.price });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.controls.products.length === 0) {
      this.addProductLine();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    const raw = this.form.getRawValue();
    const products: GourmetOrderProduct[] = raw.products.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      price: Number(line.price),
    }));

    this.submitted.emit({
      uuid: this.order()?.uuid,
      values: {
        userId: raw.userId.trim(),
        status: raw.status,
        products,
        totalPrice: this.getTotalPrice(),
      },
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private clearProducts(): void {
    while (this.form.controls.products.length > 0) {
      this.form.controls.products.removeAt(0);
    }
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
  }
}
