import { Routes } from '@angular/router';

export const GOURMET_ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/gourmet-orders/gourmet-orders').then((m) => m.GourmetOrders),
  },
];
