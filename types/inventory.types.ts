import { Product } from "./products.types";

export interface InventoryTransaction {
  id: number;
  product_id: number;
  type: 'restock' | 'sale';
  quantity: number;
  timestamp: string;
}

export interface InsertInventory {
  product: Product;
  type: 'restock' | 'sale';
  quantity: number;
}