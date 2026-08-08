import { Routes } from '@angular/router';

export const GOURMET_PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/gourmet-products/gourmet-products').then((m) => m.GourmetProducts),
  },
];
