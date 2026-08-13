export interface GourmetOrderProduct {
  productId: string;
  quantity: number;
  price: number;
}

export interface GourmetOrderDB {
  _id: string;
  userId: string;
  products: GourmetOrderProduct[];
  totalPrice: number;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface GourmetOrder {
  uuid: string;
  userId: string;
  products: GourmetOrderProduct[];
  totalPrice: number;
  status: GourmetOrderStatus;
  createdAt?: string;
}

export type AddGourmetOrder = Omit<GourmetOrder, 'uuid' | 'createdAt'>;

export type UpdateGourmetOrder = AddGourmetOrder;

export type GourmetOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivered'
  | 'cancelled';

export const GOURMET_ORDER_STATUS_OPTIONS: readonly GourmetOrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'delivered',
  'cancelled',
];

export const GOURMET_ORDER_STATUS_LABELS: Record<GourmetOrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

function toOrderStatus(value: string): GourmetOrderStatus {
  return (GOURMET_ORDER_STATUS_OPTIONS as readonly string[]).includes(value)
    ? (value as GourmetOrderStatus)
    : 'pending';
}

export function mapGourmetOrderDBToGourmetOrder(gourmetOrderDB: GourmetOrderDB): GourmetOrder {
  return {
    uuid: gourmetOrderDB._id,
    userId: gourmetOrderDB.userId,
    products: gourmetOrderDB.products ?? [],
    totalPrice: gourmetOrderDB.totalPrice,
    status: toOrderStatus(gourmetOrderDB.status),
    createdAt: gourmetOrderDB.createdAt
      ? new Date(gourmetOrderDB.createdAt).toISOString()
      : undefined,
  };
}

export function getGourmetOrderStatusLabel(status: string): string {
  return GOURMET_ORDER_STATUS_LABELS[status as GourmetOrderStatus] ?? status;
}
