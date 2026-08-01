import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';

export interface ProductMetricItem {
  id: number;
  name: string;
  quantity: number;
  expiry_date?: string | null;
  cost_price?: number;
  selling_price?: number;
}

export interface SaleMetricItem {
  id: number;
  created_at: string;
  total_amount: number;
  cost_total?: number;
}

export interface HourlySalesGroup {
  hour: number;
  total: number;
  count: number;
}

export function calculateProfitMargin(
  totalSales: number,
  totalCost: number,
): number {
  if (totalSales <= 0) return 0;
  const profit = totalSales - totalCost;
  return Math.round((profit / totalSales) * 100);
}

export function filterLowStockProduct<T extends ProductMetricItem>(
  products: T[],
): T[] {
  return products.filter(
    (p) => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD,
  );
}

export function filterExpiringProducts<T extends ProductMetricItem>(
  products: T[],
  daysThreshold: number = 7,
): T[] {
  const now = new Date().getTime();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

  return products.filter((p) => {
    if (!p.expiry_date) return false;
    const expiryTime = new Date(p.expiry_date).getTime();
    return expiryTime > now && expiryTime - now <= thresholdMs;
  });
}

export function filterOverdueDebts<T extends { is_overdue?: boolean }>(
  credits: T[],
): T[] {
  return credits.filter((c) => !!c.is_overdue);
}

export function groupSalesByHour<T extends SaleMetricItem>(
  sales: T[],
): HourlySalesGroup[] {
  const map = new Map<number, HourlySalesGroup>();

  for (let h = 0; h < 24; h++) {
    map.set(h, { hour: h, total: 0, count: 0 });
  }

  for (const sale of sales) {
    const hour = new Date(sale.created_at).getHours();
    const existing = map.get(hour) || { hour, total: 0, count: 0 };
    map.set(hour, {
      hour,
      total: existing.total + sale.total_amount,
      count: existing.count + 1,
    });
  }

  return Array.from(map.values());
}
