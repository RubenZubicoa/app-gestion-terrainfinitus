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
  BOOKING_PAYMENT_STATUS_LABELS,
  BOOKING_PAYMENT_STATUS_OPTIONS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
  Booking,
  BookingPaymentStatus,
  BookingStatus,
  getBookingPaymentMethodLabel,
  getBookingPaymentStatusLabel,
  getBookingStatusLabel,
} from '../../../../core/models/terrainfinitus/Booking';
import { BookingService } from '../../../../core/services/terrainfinitus/booking.service';
import { formatEuro } from '../../../../shared/utils/currency';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  BookingFormDialog,
  BookingFormSubmit,
} from '../../components/booking-form-dialog/booking-form-dialog';

type StatusFilter = BookingStatus | 'all';
type PaymentStatusFilter = BookingPaymentStatus | 'all';

@Component({
  selector: 'app-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BookingFormDialog],
  providers: [DatePipe],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
})
export class Bookings implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingBooking = signal<Booking | null>(null);

  protected readonly userFilter = signal('');
  protected readonly roomFilter = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly paymentStatusFilter = signal<PaymentStatusFilter>('all');
  protected readonly startDateFilter = signal('');

  protected readonly statusFilterOptions = [
    { value: 'all' as const, label: 'Todos' },
    ...BOOKING_STATUS_OPTIONS.map((status) => ({
      value: status,
      label: BOOKING_STATUS_LABELS[status],
    })),
  ];

  protected readonly paymentStatusFilterOptions = [
    { value: 'all' as const, label: 'Todos' },
    ...BOOKING_PAYMENT_STATUS_OPTIONS.map((status) => ({
      value: status,
      label: BOOKING_PAYMENT_STATUS_LABELS[status],
    })),
  ];

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.userFilter().trim() !== '' ||
      this.roomFilter().trim() !== '' ||
      this.statusFilter() !== 'all' ||
      this.paymentStatusFilter() !== 'all' ||
      this.startDateFilter() !== ''
    );
  });

  protected readonly filteredBookings = computed(() => {
    const user = this.userFilter().trim().toLowerCase();
    const room = this.roomFilter().trim().toLowerCase();
    const status = this.statusFilter();
    const paymentStatus = this.paymentStatusFilter();
    const startDate = this.startDateFilter();

    return this.bookings().filter((booking) => {
      if (user && !booking.userId.toLowerCase().includes(user)) {
        return false;
      }

      if (room && !booking.roomId.toLowerCase().includes(room)) {
        return false;
      }

      if (status !== 'all' && booking.status !== status) {
        return false;
      }

      if (paymentStatus !== 'all' && booking.paymentStatus !== paymentStatus) {
        return false;
      }

      if (startDate && !this.matchesDateFilter(booking.startDate, startDate)) {
        return false;
      }

      return true;
    });
  });

  protected readonly tableColumns = computed<DataTableColumn<Booking>[]>(() => [
    {
      key: 'startDate',
      label: 'Entrada',
      cellClass: 'text-slate-600 whitespace-nowrap',
      format: (booking) => this.datePipe.transform(booking.startDate, 'dd/MM/yyyy') ?? '—',
    },
    {
      key: 'endDate',
      label: 'Salida',
      cellClass: 'text-slate-600 whitespace-nowrap',
      format: (booking) => this.datePipe.transform(booking.endDate, 'dd/MM/yyyy') ?? '—',
    },
    {
      key: 'userId',
      label: 'Usuario',
      cellClass: 'max-w-[8rem] truncate text-slate-600',
      format: (booking) => booking.userId,
    },
    {
      key: 'roomId',
      label: 'Habitación',
      cellClass: 'max-w-[8rem] truncate text-slate-600',
      format: (booking) => booking.roomId,
    },
    {
      key: 'guests',
      label: 'Huéspedes',
      format: (booking) => booking.guests,
    },
    {
      key: 'price',
      label: 'Precio',
      cellClass: 'font-medium text-slate-900',
      format: (booking) => formatEuro(booking.price),
    },
    {
      key: 'status',
      label: 'Estado',
      cellClass: 'text-slate-600',
      format: (booking) => getBookingStatusLabel(booking.status),
    },
    {
      key: 'paymentStatus',
      label: 'Pago',
      cellClass: 'text-slate-600',
      format: (booking) => getBookingPaymentStatusLabel(booking.paymentStatus),
    },
    {
      key: 'paymentMethod',
      label: 'Método',
      cellClass: 'text-slate-600',
      format: (booking) => getBookingPaymentMethodLabel(booking.paymentMethod),
    },
  ]);

  ngOnInit(): void {
    this.loadBookings();
  }

  protected onUserFilterChange(event: Event): void {
    this.userFilter.set((event.target as HTMLInputElement).value);
  }

  protected onRoomFilterChange(event: Event): void {
    this.roomFilter.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected onPaymentStatusFilterChange(event: Event): void {
    this.paymentStatusFilter.set(
      (event.target as HTMLSelectElement).value as PaymentStatusFilter,
    );
  }

  protected onStartDateFilterChange(event: Event): void {
    this.startDateFilter.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters(): void {
    this.userFilter.set('');
    this.roomFilter.set('');
    this.statusFilter.set('all');
    this.paymentStatusFilter.set('all');
    this.startDateFilter.set('');
  }

  protected openAddForm(): void {
    this.editingBooking.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(booking: Booking): void {
    this.editingBooking.set(booking);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingBooking.set(null);
  }

  protected onBookingSubmitted(payload: BookingFormSubmit): void {
    if (payload.uuid) {
      this.bookingService
        .updateBooking({ uuid: payload.uuid, ...payload.values })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadBookings();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar la reserva.'),
        });
      return;
    }

    this.bookingService
      .createBooking(payload.values)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadBookings();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear la reserva.'),
      });
  }

  protected deleteBooking(booking: Booking): void {
    const label = `${this.datePipe.transform(booking.startDate, 'dd/MM/yyyy') ?? ''} · ${booking.roomId}`;
    const confirmed = confirm(`¿Eliminar la reserva "${label}"?`);

    if (!confirmed) {
      return;
    }

    this.bookingService
      .deleteBooking(booking.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadBookings(),
        error: () => this.error.set('No se pudo eliminar la reserva.'),
      });
  }

  protected trackBooking(booking: Booking): string {
    return booking.uuid;
  }

  private matchesDateFilter(value: Date, dateValue: string): boolean {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === dateValue;
  }

  private loadBookings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bookingService
      .getBookings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bookings) => {
          const sorted = [...bookings].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          );
          this.bookings.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las reservas.');
        },
      });
  }
}
