import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ShippingCost } from '../../../../core/models/the-lake/ShippingCost';
import { ShippingCostService } from '../../../../core/services/the-lake/shipping-cost.service';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import { formatEuro } from '../../../../shared/utils/currency';
import {
  ShippingCostFormDialog,
  ShippingCostFormSubmit,
} from '../../components/shipping-cost-form-dialog/shipping-cost-form-dialog';

@Component({
  selector: 'app-shipping-costs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, ShippingCostFormDialog],
  templateUrl: './shipping-costs.html',
  styleUrl: './shipping-costs.css',
})
export class ShippingCosts implements OnInit {
  private readonly shippingCostService = inject(ShippingCostService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly shippingCosts = signal<ShippingCost[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingShippingCost = signal<ShippingCost | null>(null);

  protected readonly tableColumns = computed<DataTableColumn<ShippingCost>[]>(() => [
    {
      key: 'zone',
      label: 'Zona',
      cellClass: 'font-medium text-slate-900',
      format: (item) => item.zone,
    },
    {
      key: 'costList',
      label: 'Compañías / costes',
      cellClass: 'max-w-md text-slate-600',
      format: (item) =>
        item.costList.length > 0
          ? item.costList.map((entry) => `${entry.company}: ${formatEuro(entry.cost)}`).join(' · ')
          : '—',
    },
    {
      key: 'companies',
      label: 'Nº compañías',
      cellClass: 'text-slate-600',
      format: (item) => item.costList.length,
    },
  ]);

  ngOnInit(): void {
    this.loadShippingCosts();
  }

  protected openAddForm(): void {
    this.editingShippingCost.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(shippingCost: ShippingCost): void {
    this.editingShippingCost.set(shippingCost);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingShippingCost.set(null);
  }

  protected onShippingCostSubmitted(payload: ShippingCostFormSubmit): void {
    if (payload.uuid) {
      this.shippingCostService
        .updateShippingCost(payload.uuid, {
          zone: payload.zone,
          costList: payload.costList,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadShippingCosts();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el coste de envío.'),
        });
      return;
    }

    this.shippingCostService
      .createShippingCost({
        zone: payload.zone,
        costList: payload.costList,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadShippingCosts();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el coste de envío.'),
      });
  }

  protected deleteShippingCost(shippingCost: ShippingCost): void {
    const confirmed = confirm(`¿Eliminar los costes de envío de la zona "${shippingCost.zone}"?`);

    if (!confirmed) {
      return;
    }

    this.shippingCostService
      .deleteShippingCost(shippingCost.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadShippingCosts(),
        error: () => this.error.set('No se pudo eliminar el coste de envío.'),
      });
  }

  protected trackShippingCost(shippingCost: ShippingCost): string {
    return shippingCost.uuid;
  }

  private loadShippingCosts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.shippingCostService
      .getShippingCosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.shippingCosts.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los costes de envío.');
        },
      });
  }
}
