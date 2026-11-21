import { InventoryEventType } from '@/types/inventory.types';

export type LedgerTypeFilter = 'all' | 'restock' | 'sale' | 'damaged' | 'adjustment';

export function isLedgerTypeFilter(
  t: InventoryEventType,
): t is Exclude<LedgerTypeFilter, 'all'> {
  return t === 'restock' || t === 'sale' || t === 'damaged' || t === 'adjustment';
}
