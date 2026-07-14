import { CurrencyPipe, DatePipe } from '@angular/common';
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
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  Order,
  OrderStatus,
} from '../../../../core/models/the-lake/Order';
import { OrderService } from '../../../../core/services/the-lake/order-service';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  OrderDetailDialog,
  OrderDetailSubmit,
} from '../../components/order-detail-dialog/order-detail-dialog';

type StatusFilter = OrderStatus | 'all';

@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, OrderDetailDialog],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showDetail = signal(false);
  protected readonly selectedOrder = signal<Order | null>(null);
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly statusFilterOptions = [
    { value: 'all' as const, label: 'Todos' },
    ...ORDER_STATUS_OPTIONS.map((status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    })),
  ];

  protected readonly filteredOrders = computed(() => {
    const filter = this.statusFilter();
    const orders = this.orders();

    if (filter === 'all') {
      return orders;
    }

    return orders.filter((order) => order.status === filter);
  });

  protected readonly tableColumns = computed<DataTableColumn<Order>[]>(() => [
    {
      key: 'createdAt',
      label: 'Fecha',
      cellClass: 'text-slate-600 whitespace-nowrap',
      format: (order) => this.datePipe.transform(order.createdAt, 'dd/MM/yyyy HH:mm') ?? '—',
    },
    {
      key: 'customer',
      label: 'Cliente',
      cellClass: 'font-medium text-slate-900',
      format: (order) => `${order.name} ${order.lastName}`.trim(),
    },
    {
      key: 'email',
      label: 'Email',
      cellClass: 'text-slate-600',
      format: (order) => order.email,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      cellClass: 'text-slate-600',
      format: (order) => order.phone,
    },
    {
      key: 'products',
      label: 'Productos',
      cellClass: 'text-slate-600',
      format: (order) => order.products.length,
    },
    {
      key: 'total',
      label: 'Total',
      cellClass: 'font-medium text-slate-900',
      format: (order) => this.currencyPipe.transform(order.total, 'EUR') ?? '',
    },
    {
      key: 'status',
      label: 'Estado',
      cellClass: 'text-slate-600',
      format: (order) => ORDER_STATUS_LABELS[order.status],
    },
  ]);

  ngOnInit(): void {
    this.loadOrders();
  }

  protected onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as StatusFilter;
    this.statusFilter.set(value);
  }

  protected openDetail(order: Order): void {
    this.selectedOrder.set(order);
    this.showDetail.set(true);
  }

  protected closeDetail(): void {
    this.showDetail.set(false);
    this.selectedOrder.set(null);
  }

  protected onOrderSubmitted(payload: OrderDetailSubmit): void {
    this.orderService
      .updateOrder(payload.uuid, { status: payload.status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadOrders();
          this.closeDetail();
        },
        error: () => this.error.set('No se pudo actualizar el pedido.'),
      });
  }

  protected deleteOrder(order: Order): void {
    const customerName = `${order.name} ${order.lastName}`.trim();
    const confirmed = confirm(`¿Eliminar el pedido de "${customerName}"?`);

    if (!confirmed) {
      return;
    }

    this.orderService
      .deleteOrder(order.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadOrders(),
        error: () => this.error.set('No se pudo eliminar el pedido.'),
      });
  }

  protected trackOrder(order: Order): string {
    return order.uuid;
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          const sorted = [...orders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          this.orders.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los pedidos.');
        },
      });
  }
}
