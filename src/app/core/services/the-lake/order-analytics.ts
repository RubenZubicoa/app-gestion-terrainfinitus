import { Category } from '../../models/the-lake/Category';
import { Order, ORDER_STATUS_LABELS } from '../../models/the-lake/Order';
import { Product } from '../../models/the-lake/Product';

export type AnalyticsChartItem = {
  label: string;
  value: number;
  secondaryValue?: number;
};

export type AnalyticsSummary = {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalUnitsSold: number;
};

export type OrderAnalytics = {
  summary: AnalyticsSummary;
  topProductsByQuantity: AnalyticsChartItem[];
  topProductsByRevenue: AnalyticsChartItem[];
  salesByMonth: AnalyticsChartItem[];
  topCategoriesByRevenue: AnalyticsChartItem[];
  ordersByStatus: AnalyticsChartItem[];
};

const TOP_ITEMS_LIMIT = 8;

export function buildCategoryLabelMap(categories: Category[]): Map<string, string> {
  const map = new Map<string, string>();

  const addCategory = (category: Category, parentLabel?: string): void => {
    const label = parentLabel ? `${parentLabel} › ${category.label}` : category.label;
    map.set(category.uuid, label);

    for (const child of category.children ?? []) {
      addCategory(child, category.label);
    }
  };

  for (const category of categories) {
    addCategory(category);
  }

  return map;
}

export function computeOrderAnalytics(
  orders: Order[],
  products: Product[],
  categories: Category[],
): OrderAnalytics {
  const productMap = new Map(products.map((product) => [product.uuid, product]));
  const categoryLabelMap = buildCategoryLabelMap(categories);

  const productQuantity = new Map<string, { label: string; value: number }>();
  const productRevenue = new Map<string, { label: string; value: number }>();
  const categoryRevenue = new Map<string, { label: string; value: number }>();
  const monthRevenue = new Map<string, { label: string; value: number; sortKey: string }>();
  const statusCounts = new Map<string, number>();

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let countedOrders = 0;

  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);

    if (order.status === 'cancelled') {
      continue;
    }

    countedOrders += 1;
    totalRevenue += order.total;

    const orderDate = new Date(order.createdAt);
    const sortKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = orderDate.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric',
    });
    const monthEntry = monthRevenue.get(sortKey) ?? { label: monthLabel, value: 0, sortKey };
    monthEntry.value += order.total;
    monthRevenue.set(sortKey, monthEntry);

    for (const item of order.products) {
      const itemRevenue = item.qty * item.price;
      const productKey = item.uuid || item.productName;
      const productLabel = item.productName;

      totalUnitsSold += item.qty;

      const quantityEntry = productQuantity.get(productKey) ?? { label: productLabel, value: 0 };
      quantityEntry.value += item.qty;
      productQuantity.set(productKey, quantityEntry);

      const revenueEntry = productRevenue.get(productKey) ?? { label: productLabel, value: 0 };
      revenueEntry.value += itemRevenue;
      productRevenue.set(productKey, revenueEntry);

      const product = productMap.get(item.uuid);
      const categoryId = product?.categoryId ?? 'unknown';
      const categoryLabel = categoryLabelMap.get(categoryId) ?? 'Sin categoría';
      const categoryEntry = categoryRevenue.get(categoryId) ?? {
        label: categoryLabel,
        value: 0,
      };
      categoryEntry.value += itemRevenue;
      categoryRevenue.set(categoryId, categoryEntry);
    }
  }

  return {
    summary: {
      totalOrders: countedOrders,
      totalRevenue,
      averageOrderValue: countedOrders > 0 ? totalRevenue / countedOrders : 0,
      totalUnitsSold,
    },
    topProductsByQuantity: toTopItems(productQuantity, TOP_ITEMS_LIMIT),
    topProductsByRevenue: toTopItems(productRevenue, TOP_ITEMS_LIMIT),
    salesByMonth: [...monthRevenue.values()]
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ label, value }) => ({ label, value })),
    topCategoriesByRevenue: toTopItems(categoryRevenue, TOP_ITEMS_LIMIT),
    ordersByStatus: [...statusCounts.entries()].map(([status, value]) => ({
      label: ORDER_STATUS_LABELS[status as Order['status']],
      value,
    })),
  };
}

function toTopItems(
  entries: Map<string, { label: string; value: number }>,
  limit: number,
): AnalyticsChartItem[] {
  return [...entries.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(({ label, value }) => ({ label, value }));
}
