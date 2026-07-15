import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AnalyticsChartItem } from '../../../core/services/the-lake/order-analytics';

@Component({
  selector: 'app-horizontal-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './horizontal-bar-chart.html',
})
export class HorizontalBarChartComponent {
  readonly title = input.required<string>();
  readonly items = input.required<AnalyticsChartItem[]>();
  readonly valueFormatter = input<(value: number) => string>((value) => String(value));
  readonly emptyMessage = input('No hay datos disponibles.');

  protected readonly maxValue = computed(() => {
    const values = this.items().map((item) => item.value);
    return Math.max(...values, 1);
  });

  protected barWidth(value: number): number {
    return (value / this.maxValue()) * 100;
  }
}
