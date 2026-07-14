import { Routes } from "@angular/router";

export const THE_LAKE_ROUTES: Routes = [
  {
    path: 'productos',
    loadChildren: () => import('./products/product.routes').then(m => m.PRODUCT_ROUTES),
  },
  {
    path: 'categorias',
    loadChildren: () => import('./categories/category.routes').then(m => m.CATEGORY_ROUTES),
  },
  {
    path: 'marcas',
    loadChildren: () => import('./brands/brand.routes').then(m => m.BRAND_ROUTES),
  },
  {
    path: 'pedidos',
    loadChildren: () => import('./orders/order.routes').then(m => m.ORDER_ROUTES),
  },
];