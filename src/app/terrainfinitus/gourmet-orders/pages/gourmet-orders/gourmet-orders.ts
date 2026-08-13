import { DatePipe } from '@angular/common';
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

import {
  getGourmetOrderStatusLabel,
  GOURMET_ORDER_STATUS_LABELS,
  GOURMET_ORDER_STATUS_OPTIONS,
  GourmetOrder,
  GourmetOrderStatus,
} from '../../../../core/models/terrainfinitus/GourmetOrder';
import { Product } from '../../../../core/models/terrainfinitus/GourmetProduct';
import { GourmetOrderService } from '../../../../core/services/terrainfinitus/gourmet-order.service';
import { GourmetProductService } from '../../../../core/services/terrainfinitus/gourmet-product.service';
import { formatEuro } from '../../../../shared/utils/currency';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  GourmetOrderFormDialog,
  GourmetOrderFormSubmit,
} from '../../components/gourmet-order-form-dialog/gourmet-order-form-dialog';

type StatusFilter = GourmetOrderStatus | 'all';

@Component({
  selector: 'app-gourmet-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, GourmetOrderFormDialog],
  providers: [DatePipe],
  templateUrl: './gourmet-orders.html',
  styleUrl: './gourmet-orders.css',
})
export class GourmetOrders implements OnInit {
  private readonly gourmetOrderService = inject(GourmetOrderService);
  private readonly gourmetProductService = inject(GourmetProductService);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = signal<GourmetOrder[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingOrder = signal<GourmetOrder | null>(null);

  protected readonly userFilter = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly dateFilter = signal('');

  protected readonly statusFilterOptions = [
    { value: 'all' as const, label: 'Todos' },
    ...GOURMET_ORDER_STATUS_OPTIONS.map((status) => ({
      value: status,
      label: GOURMET_ORDER_STATUS_LABELS[status],
    })),
  ];

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.userFilter().trim() !== '' ||
      this.statusFilter() !== 'all' ||
      this.dateFilter() !== ''
    );
  });

  protected readonly filteredOrders = computed(() => {
    const user = this.userFilter().trim().toLowerCase();
    const status = this.statusFilter();
    const date = this.dateFilter();

    return this.orders().filter((order) => {
      if (user && !order.userId.toLowerCase().includes(user)) {
        return false;
      }

      if (status !== 'all' && order.status !== status) {
        return false;
      }

      if (date && order.createdAt && !this.matchesDateFilter(order.createdAt, date)) {
        return false;
      }

      return true;
    });
  });

  protected readonly tableColumns = computed<DataTableColumn<GourmetOrder>[]>(() => [
    {
      key: 'createdAt',
      label: 'Fecha',
      cellClass: 'text-slate-600 whitespace-nowrap',
      format: (order) =>
        order.createdAt
          ? (this.datePipe.transform(order.createdAt, 'dd/MM/yyyy HH:mm') ?? '—')
          : '—',
    },
    {
      key: 'userId',
      label: 'Usuario',
      cellClass: 'max-w-[8rem] truncate text-slate-600',
      format: (order) => order.userId,
    },
    {
      key: 'products',
      label: 'Productos',
      cellClass: 'text-slate-600',
      format: (order) => order.products.length,
    },
    {
      key: 'totalPrice',
      label: 'Total',
      cellClass: 'font-medium text-slate-900',
      format: (order) => formatEuro(order.totalPrice),
    },
    {
      key: 'status',
      label: 'Estado',
      cellClass: 'text-slate-600',
      format: (order) => getGourmetOrderStatusLabel(order.status),
    },
  ]);

  ngOnInit(): void {
    this.loadOrders();
    this.loadProducts();
  }

  protected onUserFilterChange(event: Event): void {
    this.userFilter.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected onDateFilterChange(event: Event): void {
    this.dateFilter.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters(): void {
    this.userFilter.set('');
    this.statusFilter.set('all');
    this.dateFilter.set('');
  }

  protected openAddForm(): void {
    this.editingOrder.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(order: GourmetOrder): void {
    this.editingOrder.set(order);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingOrder.set(null);
  }

  protected onOrderSubmitted(payload: GourmetOrderFormSubmit): void {
    if (payload.uuid) {
      this.gourmetOrderService
        .updateGourmetOrder(payload.uuid, payload.values)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadOrders();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar el pedido gourmet.'),
        });
      return;
    }

    this.gourmetOrderService
      .createGourmetOrder(payload.values)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadOrders();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear el pedido gourmet.'),
      });
  }

  protected deleteOrder(order: GourmetOrder): void {
    const label = order.createdAt
      ? this.datePipe.transform(order.createdAt, 'dd/MM/yyyy') ?? order.uuid
      : order.uuid;
    const confirmed = confirm(`¿Eliminar el pedido gourmet del ${label}?`);

    if (!confirmed) {
      return;
    }

    this.gourmetOrderService
      .deleteGourmetOrder(order.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadOrders(),
        error: () => this.error.set('No se pudo eliminar el pedido gourmet.'),
      });
  }

  protected trackOrder(order: GourmetOrder): string {
    return order.uuid;
  }

  private matchesDateFilter(value: string, dateValue: string): boolean {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === dateValue;
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.gourmetOrderService
      .getGourmetOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          const sorted = [...orders].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          this.orders.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los pedidos gourmet.');
        },
      });
  }

  private loadProducts(): void {
    this.gourmetProductService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => this.products.set(products),
      });
  }
}
