import { Routes } from '@angular/router';

export const TERRAINFINITUS_ROUTES: Routes = [
  {
    path: 'reservas',
    loadChildren: () => import('./bookings/booking.routes').then((m) => m.BOOKING_ROUTES),
  },
  {
    path: 'productos-gourmet',
    loadChildren: () =>
      import('./gourmet-products/gourmet-product.routes').then((m) => m.GOURMET_PRODUCT_ROUTES),
  },
  {
    path: 'pedidos-gourmet',
    loadChildren: () =>
      import('./gourmet-orders/gourmet-order.routes').then((m) => m.GOURMET_ORDER_ROUTES),
  },
];
