export interface InventoryTransaction {
  id: number;
  product_id: number;
  type: 'restock' | 'sale';
  quantity: number;
  timestamp: string;
}