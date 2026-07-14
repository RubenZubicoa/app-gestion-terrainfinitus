import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/orders/orders').then((m) => m.Orders),
  },
];
