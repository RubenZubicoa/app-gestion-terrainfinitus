import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NewsLetterSubscription } from '../../../../core/models/the-lake/NewsLetterSubscription';
import { NewsLetterSubscriptionService } from '../../../../core/services/the-lake/newsletter-subscription.service';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table';
import {
  NewsLetterSubscriptionFormDialog,
  NewsLetterSubscriptionFormSubmit,
} from '../../components/newsletter-subscription-form-dialog/newsletter-subscription-form-dialog';

@Component({
  selector: 'app-newsletter-subscriptions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, NewsLetterSubscriptionFormDialog],
  templateUrl: './newsletter-subscriptions.html',
  styleUrl: './newsletter-subscriptions.css',
})
export class NewsLetterSubscriptions implements OnInit {
  private readonly subscriptionService = inject(NewsLetterSubscriptionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly subscriptions = signal<NewsLetterSubscription[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingSubscription = signal<NewsLetterSubscription | null>(null);

  protected readonly tableColumns = computed<DataTableColumn<NewsLetterSubscription>[]>(() => [
    {
      key: 'email',
      label: 'Email',
      cellClass: 'font-medium text-slate-900',
      format: (item) => item.email,
    },
    {
      key: 'createdAt',
      label: 'Fecha de alta',
      cellClass: 'text-slate-600',
      format: (item) =>
        item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-ES') : '—',
    },
  ]);

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  protected openAddForm(): void {
    this.editingSubscription.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(subscription: NewsLetterSubscription): void {
    this.editingSubscription.set(subscription);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingSubscription.set(null);
  }

  protected onSubscriptionSubmitted(payload: NewsLetterSubscriptionFormSubmit): void {
    if (payload.uuid) {
      this.subscriptionService
        .updateSubscription(payload.uuid, { email: payload.email })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadSubscriptions();
            this.closeForm();
          },
          error: () => this.error.set('No se pudo actualizar la suscripción.'),
        });
      return;
    }

    this.subscriptionService
      .createSubscription({ email: payload.email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadSubscriptions();
          this.closeForm();
        },
        error: () => this.error.set('No se pudo crear la suscripción.'),
      });
  }

  protected deleteSubscription(subscription: NewsLetterSubscription): void {
    const confirmed = confirm(`¿Eliminar la suscripción "${subscription.email}"?`);

    if (!confirmed) {
      return;
    }

    this.subscriptionService
      .deleteSubscription(subscription.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadSubscriptions(),
        error: () => this.error.set('No se pudo eliminar la suscripción.'),
      });
  }

  protected trackSubscription(subscription: NewsLetterSubscription): string {
    return subscription.uuid;
  }

  private loadSubscriptions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.subscriptionService
      .getSubscriptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.subscriptions.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las suscripciones.');
        },
      });
  }
}
