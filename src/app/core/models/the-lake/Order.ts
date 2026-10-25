export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'shipped',
  'delivered',
  'cancelled',
];

export interface OrderItem {
  productName: string;
  qty: number;
  price: number;
}

export type OrderDB = {
  _id: string;
  dni: string;
  name: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  products: { uuid: string; productName: string; qty: number; price: number }[];
  status: OrderStatus;
  createdAt: string;
  shippingCost: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface Order {
  uuid: string;
  dni: string;
  name: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  products: { uuid: string; productName: string; qty: number; price: number }[];
  status: OrderStatus;
  createdAt: string;
  shippingCost: number;
}

export type AddOrder = Omit<Order, 'uuid' | 'createdAt' | 'updatedAt' | 'status'> & {
  paymentMethod?: string;
};

export type UpdateOrder = Partial<
  Pick<
    Order,
    'dni' | 'name' | 'lastName' | 'address' | 'phone' | 'email' | 'status' | 'shippingCost'
  >
>;

export function mapOrderDBToOrder(orderDB: OrderDB): Order {
  return {
    uuid: orderDB._id,
    dni: orderDB.dni,
    name: orderDB.name,
    lastName: orderDB.lastName,
    address: orderDB.address,
    phone: orderDB.phone,
    email: orderDB.email,
    products: orderDB.products,
    status: orderDB.status,
    createdAt: orderDB.createdAt,
    shippingCost: Number(orderDB.shippingCost) || 0,
  };
}

export function getOrderProductsSubtotal(order: Pick<Order, 'products'>): number {
  return order.products.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function getOrderTotal(order: Pick<Order, 'products' | 'shippingCost'>): number {
  return getOrderProductsSubtotal(order) + (Number(order.shippingCost) || 0);
}
