import { Product } from "./products.types";

export type InventoryEventType =
  | 'restock' | 'sale' | 'damaged' | 'adjustment';

export interface InventoryTransaction {
  id: number;
  product_id: number;
  type: InventoryEventType;
  quantity: number;
  note?: string | null;
  adjustment_sign?: 'positive' | 'negative' | null;
  unit_cost?: number | null;
  supplier_id?: string | null;
  timestamp: string;
}

export interface InsertInventory {
  product: Product;
  type: 'restock' | 'sale';
  quantity: number;
}

export interface InsertInventoryV2 {
  product_id: number;
  type: InventoryEventType;
  quantity: number; // > 0
  note?: string | null;
  adjustment_sign?: 'positive' | 'negative' | null;
  unit_cost?: number | null;
  supplier_id?: string | null;
}