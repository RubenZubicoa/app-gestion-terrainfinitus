import { Routes } from '@angular/router';

export const SHIPPING_COST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/shipping-costs/shipping-costs').then((m) => m.ShippingCosts),
  },
];
