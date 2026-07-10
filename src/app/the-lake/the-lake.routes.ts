import { Routes } from "@angular/router";

export const THE_LAKE_ROUTES: Routes = [
  {
    path: 'productos',
    loadChildren: () => import('./products/product.routes').then(m => m.PRODUCT_ROUTES),
  },
];