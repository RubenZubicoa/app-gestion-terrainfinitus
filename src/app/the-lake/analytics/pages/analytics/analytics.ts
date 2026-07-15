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
import { forkJoin } from 'rxjs';

import { Category } from '../../../../core/models/the-lake/Category';
import { Order } from '../../../../core/models/the-lake/Order';
import { Product } from '../../../../core/models/the-lake/Product';
import { CategoryService } from '../../../../core/services/the-lake/category';
import {
  computeOrderAnalytics,
  OrderAnalytics,
} from '../../../../core/services/the-lake/order-analytics';
import { OrderService } from '../../../../core/services/the-lake/order-service';
import { ProductService } from '../../../../core/services/the-lake/product';
import { formatEuro } from '../../../../shared/utils/currency';
import { HorizontalBarChartComponent } from '../../../../shared/components/horizontal-bar-chart/horizontal-bar-chart';
import { VerticalBarChartComponent } from '../../../../shared/components/vertical-bar-chart/vertical-bar-chart';

type SummaryCard = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HorizontalBarChartComponent, VerticalBarChartComponent],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly analytics = signal<OrderAnalytics | null>(null);

  protected readonly formatEuro = formatEuro;
  protected readonly formatUnits = (value: number): string => `${value} uds.`;
  protected readonly formatCount = (value: number): string => `${value}`;

  protected readonly summaryCards = computed<SummaryCard[]>(() => {
    const data = this.analytics()?.summary;

    if (!data) {
      return [];
    }

    return [
      { label: 'Pedidos completados', value: String(data.totalOrders) },
      { label: 'Ingresos totales', value: formatEuro(data.totalRevenue) },
      { label: 'Ticket medio', value: formatEuro(data.averageOrderValue) },
      { label: 'Unidades vendidas', value: String(data.totalUnitsSold) },
    ];
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      orders: this.orderService.getOrders(),
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ orders, products, categories }) => {
          this.analytics.set(this.buildAnalytics(orders, products, categories));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los datos de analítica.');
        },
      });
  }

  private buildAnalytics(
    orders: Order[],
    products: Product[],
    categories: Category[],
  ): OrderAnalytics {
    return computeOrderAnalytics(orders, products, categories);
  }
}
