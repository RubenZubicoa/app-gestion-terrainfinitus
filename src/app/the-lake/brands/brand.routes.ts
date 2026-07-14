import { Routes } from '@angular/router';

export const BRAND_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/brands/brands').then((m) => m.Brands),
  },
];
