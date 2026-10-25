import { Routes } from '@angular/router';

export const NEWSLETTER_SUBSCRIPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/newsletter-subscriptions/newsletter-subscriptions').then(
        (m) => m.NewsLetterSubscriptions,
      ),
  },
];
