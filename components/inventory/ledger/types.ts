import { InventoryEventType } from '@/types/inventory.types';

/**
 * Filter values the toolbar can produce. Deliberately narrower than
 * `InventoryEventType` — we exclude `'sale'` because the Log
 * Transaction form on this page only emits restock / damaged /
 * adjustment. Filtering by sale here would be misleading since the
 * user can't generate sale rows from this screen (sales flow through
 * the dedicated Sales tab).
 */
export type LedgerTypeFilter = 'all' | 'restock' | 'damaged' | 'adjustment';

/**
 * Type guard — narrows an `InventoryEventType` to one of the
 * filterable values this toolbar exposes. Used by the screen so a
 * stale `'sale'` selection stored from an older version of the app
 * degrades to `'all'` instead of crashing the filter.
 */
export function isLedgerTypeFilter(
  t: InventoryEventType,
): t is Exclude<LedgerTypeFilter, 'all'> {
  return t === 'restock' || t === 'damaged' || t === 'adjustment';
}
