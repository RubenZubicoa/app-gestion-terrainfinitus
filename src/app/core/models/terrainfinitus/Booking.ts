export interface BookingDB {
  _id: string;
  userId: string;
  roomId: string;
  startDate: string | Date;
  endDate: string | Date;
  guests: number;
  price: number;
  status: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Booking {
  uuid: string;
  userId: string;
  roomId: string;
  startDate: Date;
  endDate: Date;
  guests: number;
  price: number;
  status: BookingStatus;
  currency: string;
  paymentMethod: BookingPaymentMethod | string;
  paymentStatus: BookingPaymentStatus;
  paymentDate: Date;
  createdAt?: string;
}

/** Payload para crear una reserva (el backend asigna el id). */
export type CreateBooking = Omit<Booking, 'uuid' | 'createdAt'>;

export type UpdateBooking = Omit<Booking, 'createdAt'>;

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export type BookingPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type BookingPaymentMethod = 'card' | 'transfer' | 'bizum' | 'paypal';

export const BOOKING_STATUS_OPTIONS: readonly BookingStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  checked_in: 'Check-in',
  checked_out: 'Check-out',
  cancelled: 'Cancelada',
};

export const BOOKING_PAYMENT_STATUS_OPTIONS: readonly BookingPaymentStatus[] = [
  'pending',
  'paid',
  'failed',
  'refunded',
];

export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

export const BOOKING_PAYMENT_METHODS: readonly BookingPaymentMethod[] = [
  'card',
  'transfer',
  'bizum',
  'paypal',
];

export const BOOKING_PAYMENT_METHOD_LABELS: Record<BookingPaymentMethod, string> = {
  card: 'Tarjeta',
  transfer: 'Transferencia',
  bizum: 'Bizum',
  paypal: 'PayPal',
};

function toDate(value: string | Date | undefined | null): Date {
  if (!value) {
    return new Date(NaN);
  }

  return value instanceof Date ? value : new Date(value);
}

function toBookingStatus(value: string): BookingStatus {
  return (BOOKING_STATUS_OPTIONS as readonly string[]).includes(value)
    ? (value as BookingStatus)
    : 'pending';
}

function toPaymentStatus(value: string): BookingPaymentStatus {
  return (BOOKING_PAYMENT_STATUS_OPTIONS as readonly string[]).includes(value)
    ? (value as BookingPaymentStatus)
    : 'pending';
}

export function mapBookingDBToBooking(bookingDB: BookingDB): Booking {
  return {
    uuid: bookingDB._id,
    userId: bookingDB.userId,
    roomId: bookingDB.roomId,
    startDate: toDate(bookingDB.startDate),
    endDate: toDate(bookingDB.endDate),
    guests: bookingDB.guests,
    price: bookingDB.price,
    status: toBookingStatus(bookingDB.status),
    currency: bookingDB.currency,
    paymentMethod: bookingDB.paymentMethod,
    paymentStatus: toPaymentStatus(bookingDB.paymentStatus),
    paymentDate: toDate(bookingDB.paymentDate),
    createdAt: bookingDB.createdAt ? toDate(bookingDB.createdAt).toISOString() : undefined,
  };
}

export function getBookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}

export function getBookingPaymentStatusLabel(status: string): string {
  return BOOKING_PAYMENT_STATUS_LABELS[status as BookingPaymentStatus] ?? status;
}

export function getBookingPaymentMethodLabel(method: string): string {
  return BOOKING_PAYMENT_METHOD_LABELS[method as BookingPaymentMethod] ?? method;
}
