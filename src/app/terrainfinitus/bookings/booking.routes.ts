import { Routes } from '@angular/router';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/bookings/bookings').then((m) => m.Bookings),
  },
];
