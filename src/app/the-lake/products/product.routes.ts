import { Routes } from "@angular/router";

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/products/products').then(m => m.Products),
  },
];