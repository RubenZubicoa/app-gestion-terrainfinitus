import { Routes } from '@angular/router';

export const NEWSLETTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/newsletters/newsletters').then((m) => m.NewsLetters),
  },
];
