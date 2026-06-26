import { ScrollView, View } from 'react-native';
import { MotiView } from 'moti';
import { SearchBar } from '@/components/ui';
import { InventoryEventType } from '@/types/inventory.types';
import { Chip } from './Chip';

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

interface LedgerToolbarProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  selectedType: LedgerTypeFilter;
  setSelectedType: (t: LedgerTypeFilter) => void;
  /**
   * Per-type totals used to render the small count badge on each
   * chip, e.g. `Restock (12)`. Computed by the screen so the chip
   * counts stay in sync with what's actually visible.
   */
  counts: Partial<Record<InventoryEventType, number>>;
}

/**
 * LedgerToolbar — the search box + horizontal type-filter chip row
 * that sits above the transaction timeline.
 */
export function LedgerToolbar({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  counts,
}: LedgerToolbarProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 220 }}
    >
      <View className="px-4 pt-4 pb-2">
        <View className="bg-paper-50 border border-ink-200 rounded-2xl shadow-paper overflow-hidden">
          <View className="px-3 pt-3 pb-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search notes or dates…"
              accessibilityLabel="Search ledger entries"
              debounceMs={0}
            />
          </View>

          <View className="px-2 pb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 6,
                paddingVertical: 6,
                alignItems: 'center',
                gap: 2,
              }}
              className="bg-paper-200 rounded-xl"
              style={{ flexGrow: 0 }}
            >
              <Chip
                label="All"
                count={
                  (counts.restock ?? 0) +
                  (counts.damaged ?? 0) +
                  (counts.adjustment ?? 0)
                }
                active={selectedType === 'all'}
                onPress={() => setSelectedType('all')}
                accessibilityLabel="Show all ledger entries"
              />
              <Chip
                label="Restock"
                count={counts.restock ?? 0}
                active={selectedType === 'restock'}
                onPress={() => setSelectedType('restock')}
                accessibilityLabel="Show only restock entries"
              />
              <Chip
                label="Damaged"
                count={counts.damaged ?? 0}
                active={selectedType === 'damaged'}
                onPress={() => setSelectedType('damaged')}
                accessibilityLabel="Show only damaged entries"
              />
              <Chip
                label="Adjust"
                count={counts.adjustment ?? 0}
                active={selectedType === 'adjustment'}
                onPress={() => setSelectedType('adjustment')}
                accessibilityLabel="Show only adjustment entries"
              />
              {/* Note: no "Sale" chip here. Sales are not logged
                  from this form — they enter the ledger through the
                  dedicated Sales screen — so showing a Sale filter
                  here would invite the user to dig into something
                  they can't act on from this page. Historical sale
                  rows still render in the timeline, just not behind
                  a chip. */}
            </ScrollView>
          </View>
        </View>
      </View>
    </MotiView>
  );
}
