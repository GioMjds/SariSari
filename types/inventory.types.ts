import {
  LOW_STOCK_THRESHOLD,
  NEAR_EXPIRY_WINDOW_DAYS,
} from '@/constants/stocks';

export type ProductStockStatus =
  'healthy' | 'low_stock' | 'out_of_stock' | 'near_expiry' | 'newly_added';

export interface InventoryOverviewCounts {
  healthy: number;
  low: number;
  out: number;
  nearExpiry: number;
  overstock: number;
}

export type InventoryEventType = 'restock' | 'sale' | 'damaged' | 'adjustment';

export interface InventoryTransaction {
  id?: number | string;
  product_id: number;
  type: InventoryEventType;
  quantity: number;
  note?: string | null;
  adjustment_sign?: 'positive' | 'negative' | null;
  unit_cost?: number | null;
  supplier_id?: number | string | null;
  timestamp: number | string;
  product_name?: string;
}

export interface InsertInventoryV2 {
  product_id: number;
  type: InventoryEventType;
  quantity: number;
  note?: string | null;
  adjustment_sign?: 'positive' | 'negative' | null;
  unit_cost?: number | null;
  supplier_id?: number | string | null;
}

export interface ProductLike {
  quantity: number;
  expiry_date?: number | string | null;
  created_at: number | string;
}

export function getStatus(
  product: ProductLike,
  now: number = Date.now(),
): ProductStockStatus {
  if (product.quantity === 0) return 'out_of_stock';
  if (product.expiry_date) {
    const expiryMs =
      typeof product.expiry_date === 'number'
        ? product.expiry_date
        : new Date(product.expiry_date).getTime();
    if (!isNaN(expiryMs)) {
      const daysUntilExpiry = (expiryMs - now) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= NEAR_EXPIRY_WINDOW_DAYS) {
        return 'near_expiry';
      }
    }
  }
  if (product.quantity <= LOW_STOCK_THRESHOLD) return 'low_stock';
  const createdMs =
    typeof product.created_at === 'number'
      ? product.created_at
      : new Date(product.created_at).getTime();
  if (!isNaN(createdMs)) {
    const ageDays = (now - createdMs) / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) return 'newly_added';
  }
  return 'healthy';
}
