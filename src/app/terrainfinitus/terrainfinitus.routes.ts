import { Routes } from '@angular/router';

export const TERRAINFINITUS_ROUTES: Routes = [
  {
    path: 'productos-gourmet',
    loadChildren: () =>
      import('./gourmet-products/gourmet-product.routes').then((m) => m.GOURMET_PRODUCT_ROUTES),
  },
];
