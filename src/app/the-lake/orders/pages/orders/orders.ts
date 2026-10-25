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
  getOrderTotal,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  Order,
  OrderStatus,
} from '../../../../core/models/the-lake/Order';
import { OrderService } from '../../../../core/services/the-lake/order-service';
import { formatEuro } from '../../../../shared/utils/currency';
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
  providers: [DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showDetail = signal(false);
  protected readonly selectedOrder = signal<Order | null>(null);

  protected readonly customerFilter = signal('');
  protected readonly emailFilter = signal('');
  protected readonly phoneFilter = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly dateFilter = signal('');

  protected readonly statusFilterOptions = [
    { value: 'all' as const, label: 'Todos' },
    ...ORDER_STATUS_OPTIONS.map((status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    })),
  ];

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.customerFilter().trim() !== '' ||
      this.emailFilter().trim() !== '' ||
      this.phoneFilter().trim() !== '' ||
      this.statusFilter() !== 'all' ||
      this.dateFilter() !== ''
    );
  });

  protected readonly filteredOrders = computed(() => {
    const customer = this.customerFilter().trim().toLowerCase();
    const email = this.emailFilter().trim().toLowerCase();
    const phone = this.normalizePhone(this.phoneFilter());
    const status = this.statusFilter();
    const date = this.dateFilter();

    return this.orders().filter((order) => {
      if (customer) {
        const fullName = `${order.name} ${order.lastName}`.trim().toLowerCase();
        if (!fullName.includes(customer)) {
          return false;
        }
      }

      if (email && !order.email.toLowerCase().includes(email)) {
        return false;
      }

      if (phone && !this.normalizePhone(order.phone).includes(phone)) {
        return false;
      }

      if (status !== 'all' && order.status !== status) {
        return false;
      }

      if (date && !this.matchesDateFilter(order.createdAt, date)) {
        return false;
      }

      return true;
    });
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
      key: 'shippingCost',
      label: 'Envío',
      cellClass: 'text-slate-600',
      format: (order) => formatEuro(order.shippingCost),
    },
    {
      key: 'total',
      label: 'Total',
      cellClass: 'font-medium text-slate-900',
      format: (order) => formatEuro(getOrderTotal(order)),
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

  protected onCustomerFilterChange(event: Event): void {
    this.customerFilter.set((event.target as HTMLInputElement).value);
  }

  protected onEmailFilterChange(event: Event): void {
    this.emailFilter.set((event.target as HTMLInputElement).value);
  }

  protected onPhoneFilterChange(event: Event): void {
    this.phoneFilter.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected onDateFilterChange(event: Event): void {
    this.dateFilter.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters(): void {
    this.customerFilter.set('');
    this.emailFilter.set('');
    this.phoneFilter.set('');
    this.statusFilter.set('all');
    this.dateFilter.set('');
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

  private normalizePhone(value: string): string {
    return value.replace(/\D/g, '');
  }

  private matchesDateFilter(createdAt: string | number | Date, dateValue: string): boolean {
    const orderDate = new Date(createdAt);

    if (Number.isNaN(orderDate.getTime())) {
      return false;
    }

    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const day = String(orderDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}` === dateValue;
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
