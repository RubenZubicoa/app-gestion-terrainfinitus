import { Routes } from '@angular/router';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/clients/clients').then((m) => m.Clients),
  },
];
