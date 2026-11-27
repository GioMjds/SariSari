import { getStockTone } from '@/components/ui/StockBadge';
import type { Product } from '@/types/products.types';
import type { ProductSalesSplit } from '@/types/reports.types';

export type CategoryFilter = 'all' | 'out' | 'low' | 'slow' | 'nocost';
export type CategorySort = 'priority' | 'sales' | 'value' | 'name';
export type StockTone = ReturnType<typeof getStockTone>;

export interface CategoryRow {
  product: Product;
  tone: StockTone;
  /** Pieces sold for cash in the window. */
  soldUnits: number;
  /** Pieces given out on utang in the window; not counted as sold. */
  utangUnits: number;
  revenue: number;
  stockValue: number;
  hasCost: boolean;
  /** In stock, older than a week, and nothing moved in the window. */
  isSlow: boolean;
}

export interface CategorySummary {
  productCount: number;
  units: number;
  stockValue: number;
  /** Profit if every priced unit sells at the current price. */
  potentialProfit: number;
  pricedCount: number;
  soldUnits: number;
  utangUnits: number;
  revenue: number;
  out: number;
  low: number;
  slow: number;
  missingCost: number;
}

const WATCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// SQLite CURRENT_TIMESTAMP is UTC without a zone marker.
function parseCreatedAt(value: string): number {
  const iso =
    value.includes(' ') && !value.includes('T')
      ? `${value.replace(' ', 'T')}Z`
      : value;
  return new Date(iso).getTime();
}

export function buildCategoryRows(
  products: Product[],
  /** Undefined while sales load or after a failed read; no product is called slow then. */
  sales: ProductSalesSplit[] | undefined,
  now: number = Date.now(),
): CategoryRow[] {
  const byId = new Map((sales ?? []).map((s) => [s.productId, s]));
  return products.map((product) => {
    const s = byId.get(product.id);
    const quantity = product.quantity || 0;
    const soldUnits = s?.cashUnits ?? 0;
    const utangUnits = s?.utangUnits ?? 0;
    const isNew = now - parseCreatedAt(product.created_at) < WATCH_WINDOW_MS;
    return {
      product,
      tone: getStockTone(quantity),
      soldUnits,
      utangUnits,
      revenue: s?.cashRevenue ?? 0,
      stockValue: (product.price || 0) * quantity,
      hasCost: product.cost_price != null && product.cost_price > 0,
      isSlow: !!sales && quantity > 0 && soldUnits + utangUnits === 0 && !isNew,
    };
  });
}

export function summarizeCategory(rows: CategoryRow[]): CategorySummary {
  const summary: CategorySummary = {
    productCount: rows.length,
    units: 0,
    stockValue: 0,
    potentialProfit: 0,
    pricedCount: 0,
    soldUnits: 0,
    utangUnits: 0,
    revenue: 0,
    out: 0,
    low: 0,
    slow: 0,
    missingCost: 0,
  };
  for (const row of rows) {
    const quantity = row.product.quantity || 0;
    summary.units += quantity;
    summary.stockValue += row.stockValue;
    summary.soldUnits += row.soldUnits;
    summary.utangUnits += row.utangUnits;
    summary.revenue += row.revenue;
    if (row.tone === 'out') summary.out++;
    if (row.tone === 'low') summary.low++;
    if (row.isSlow) summary.slow++;
    if (row.hasCost) {
      summary.pricedCount++;
      summary.potentialProfit +=
        ((row.product.price || 0) - row.product.cost_price!) * quantity;
    } else {
      summary.missingCost++;
    }
  }
  return summary;
}

const FILTERS: Record<CategoryFilter, (row: CategoryRow) => boolean> = {
  all: () => true,
  out: (row) => row.tone === 'out',
  low: (row) => row.tone === 'low',
  slow: (row) => row.isSlow,
  nocost: (row) => !row.hasCost,
};

// Out of stock first, then low, then slow; demand breaks ties so best sellers surface first.
function priorityRank(row: CategoryRow): number {
  if (row.tone === 'out') return 0;
  if (row.tone === 'low') return 1;
  if (row.isSlow) return 2;
  return 3;
}

const byName = (a: CategoryRow, b: CategoryRow) =>
  a.product.name.localeCompare(b.product.name);

const SORTS: Record<CategorySort, (a: CategoryRow, b: CategoryRow) => number> =
  {
    priority: (a, b) =>
      priorityRank(a) - priorityRank(b) ||
      b.soldUnits - a.soldUnits ||
      byName(a, b),
    sales: (a, b) =>
      b.soldUnits - a.soldUnits || b.revenue - a.revenue || byName(a, b),
    value: (a, b) => b.stockValue - a.stockValue || byName(a, b),
    name: byName,
  };

export function selectCategoryRows(
  rows: CategoryRow[],
  filter: CategoryFilter,
  sort: CategorySort,
): CategoryRow[] {
  return rows.filter(FILTERS[filter]).sort(SORTS[sort]);
}

export function topSellers(rows: CategoryRow[], limit = 3): CategoryRow[] {
  return rows
    .filter((row) => row.soldUnits > 0)
    .sort(SORTS.sales)
    .slice(0, limit);
}
