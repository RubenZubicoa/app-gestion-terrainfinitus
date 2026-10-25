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
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ShippingCost,
  ShippingCostList,
} from '../../../../core/models/the-lake/ShippingCost';

export type ShippingCostFormSubmit = {
  uuid?: string;
  zone: string;
  costList: ShippingCostList[];
};

type CostLineGroup = FormGroup<{
  company: FormControl<string>;
  cost: FormControl<number | null>;
}>;

@Component({
  selector: 'app-shipping-cost-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './shipping-cost-form-dialog.html',
})
export class ShippingCostFormDialog {
  readonly shippingCost = input<ShippingCost | null>(null);

  readonly submitted = output<ShippingCostFormSubmit>();
  readonly cancelled = output<void>();

  protected readonly showValidationSummary = signal(false);

  protected readonly form = new FormGroup({
    zone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    costList: new FormArray<CostLineGroup>([]),
  });

  constructor() {
    effect(() => {
      const shippingCost = this.shippingCost();

      untracked(() => {
        this.showValidationSummary.set(false);
        this.clearCostLines();

        if (shippingCost) {
          this.form.patchValue({ zone: shippingCost.zone });

          for (const item of shippingCost.costList) {
            this.addCostLine(item);
          }

          if (shippingCost.costList.length === 0) {
            this.addCostLine();
          }
        } else {
          this.form.reset({ zone: '' });
          this.addCostLine();
        }
      });
    });
  }

  protected get isEditing(): boolean {
    return this.shippingCost() !== null;
  }

  protected get costLines(): CostLineGroup[] {
    return this.form.controls.costList.controls;
  }

  protected fieldError(controlName: 'zone'): string | null {
    const control = this.form.controls[controlName];

    if (!control || !this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    return 'Revisa este campo.';
  }

  protected lineFieldError(line: CostLineGroup, field: 'company' | 'cost'): string | null {
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

  protected addCostLine(item?: ShippingCostList): void {
    this.form.controls.costList.push(
      new FormGroup({
        company: new FormControl(item?.company ?? '', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        cost: new FormControl<number | null>(item?.cost ?? null, {
          validators: [Validators.required, Validators.min(0)],
        }),
      }),
    );
  }

  protected removeCostLine(index: number): void {
    if (this.form.controls.costList.length <= 1) {
      return;
    }

    this.form.controls.costList.removeAt(index);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.form.controls.costList.length === 0) {
      this.addCostLine();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      return;
    }

    this.showValidationSummary.set(false);

    const raw = this.form.getRawValue();
    const costList: ShippingCostList[] = raw.costList.map((line) => ({
      company: line.company.trim(),
      cost: Number(line.cost),
    }));

    this.submitted.emit({
      uuid: this.shippingCost()?.uuid,
      zone: raw.zone.trim(),
      costList,
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private clearCostLines(): void {
    while (this.form.controls.costList.length > 0) {
      this.form.controls.costList.removeAt(0);
    }
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.showValidationSummary());
  }
}
