import React, { useMemo, useCallback, memo } from 'react';
import { View, SectionList, RefreshControl } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { format, isToday, isYesterday, isValid } from 'date-fns';
import { StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import {
  InventoryTransaction,
  InventoryEventType,
} from '@/types/inventory.types';
import { parseStoredTimestamp } from '@/utils/timezone';
import { LedgerTypeFilter } from './LedgerToolbar';

interface LedgerListProps {
  /**
   * The full transaction list for the product (last 30 days, as
   * returned by `useInventoryTransactionsByProduct`). The list
   * component owns the in-place filtering so the screen file stays
   * declarative.
   */
  transactions: InventoryTransaction[];
  /**
   * The product's current on-hand count. Used as the seed for the
   * running-balance calculation so the topmost visible row's
   * balance reflects "what the cashier actually has on the shelf."
   */
  currentStock: number;
  searchQuery: string;
  selectedType: LedgerTypeFilter;
  isRefetching?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
}

const LIST_CONTAINER_STYLE = { paddingBottom: 140 } as const;

type LedgerRowData = InventoryTransaction & { runningBalance: number };

const keyExtractor = (item: LedgerRowData) => `${item.type}-${item.id}`;

/**
 * LedgerList — the filtered, animated transaction timeline.
 *
 * Uses SectionList for high-performance virtualized rendering.
 * The screen passes the raw 30-day list; this component filters it,
 * computes a **running balance** for each row, groups entries into
 * sticky day buckets, and renders them with the same receipt-ledger
 * visual language used by `components/utang/credit-details/`.
 */
export const LedgerList = memo(function LedgerList({
  transactions,
  currentStock,
  searchQuery,
  selectedType,
  isRefetching,
  onRefresh,
  ListHeaderComponent,
}: LedgerListProps) {
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }
      if (query) {
        const note = tx.note?.toLowerCase() ?? '';
        const date = formatDateTime(tx.timestamp).toLowerCase();
        if (!note.includes(query) && !date.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, searchQuery, selectedType]);

  // Build rows with a running balance. We walk newest→oldest and
  // back-fill: the most recent row's balance equals current stock,
  // then we subtract each row's delta moving backward.
  const rowsWithBalance = useMemo(() => {
    const ordered = [...filtered].sort((a, b) => {
      const ta = parseStoredTimestamp(a.timestamp)?.getTime() ?? 0;
      const tb = parseStoredTimestamp(b.timestamp)?.getTime() ?? 0;
      return tb - ta;
    });
    let running = currentStock;
    return ordered.map((tx) => {
      const row = { ...tx, runningBalance: running };
      running -= signedQuantity(tx);
      return row;
    });
  }, [filtered, currentStock]);

  // Group by day bucket for the sticky day separator UX.
  const groups = useMemo(() => groupByDay(rowsWithBalance), [rowsWithBalance]);

  const sections = useMemo(() => {
    return groups.map((g) => ({
      key: g.key,
      label: g.label,
      data: g.entries,
    }));
  }, [groups]);

  const renderItem = useCallback(
    ({ item, index }: { item: LedgerRowData; index: number }) => {
      // Stagger animation delay per item within its section to prevent lag
      const delay = (index % 8) * 40;
      return (
        <View className="px-4">
          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
              type: 'timing',
              duration: 280,
              delay,
            }}
            className="mb-2.5"
          >
            <LedgerRow row={item} />
          </MotiView>
        </View>
      );
    },
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section: { label, data } }: { section: { label: string; data: any[] } }) => (
      <View className="px-4 mt-2">
        <DaySeparator label={label} count={data.length} />
      </View>
    ),
    [],
  );

  const renderEmpty = useCallback(() => (
    <View className="px-4">
      <LedgerNoMatches />
    </View>
  ), []);

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={LIST_CONTAINER_STYLE}
      showsVerticalScrollIndicator={false}
      keyExtractor={keyExtractor}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={onRefresh}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        ) : undefined
      }
    />
  );
});

/* ─── Single row ──────────────────────────────────────────────────── */

const LedgerRow = memo(function LedgerRow({
  row,
}: {
  row: InventoryTransaction & { runningBalance: number };
}) {
  const qty = signedQuantity(row);
  const positive = qty > 0;
  const noteTrimmed = row.note?.trim();
  const hasNote = !!noteTrimmed;
  const dateLabel = formatDateTime(row.timestamp);

  return (
    <View className="bg-paper-50 border border-ink-100 rounded-2xl shadow-paper px-4 py-3.5 flex-row items-start">
      {/* Icon circle */}
      <View className="mr-3 mt-0.5">
        <EventIcon type={row.type} sign={row.adjustment_sign} />
      </View>

      {/* Event info */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-center gap-2 flex-wrap">
          <EventPill type={row.type} sign={row.adjustment_sign} />
        </View>
        {hasNote && (
          <StyledText
            variant="medium"
            className="text-ink-900 text-sm mt-1.5 leading-5"
            numberOfLines={2}
          >
            {noteTrimmed}
          </StyledText>
        )}
        <View className="flex-row items-center mt-1.5">
          <FontAwesome name="clock-o" size={9} color="#A89F90" />
          <StyledText
            variant="medium"
            className="text-mono text-ink-400 ml-1.5"
            style={{ fontSize: 11 }}
          >
            {dateLabel}
          </StyledText>
        </View>
      </View>

      {/* Qty + running balance */}
      <View className="items-end">
        <StyledText
          variant="black"
          className={`text-base ${positive ? 'text-sage-700' : 'text-semantic-danger'}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {positive ? '+' : ''}
          {qty}
        </StyledText>
        <StyledText
          variant="medium"
          className="text-mono text-ink-400 mt-0.5"
          style={{ fontSize: 10 }}
        >
          pcs
        </StyledText>
        <View className="mt-2 px-2.5 py-1 rounded-pill bg-paper-100 border border-ink-200">
          <StyledText
            variant="extrabold"
            className="text-mono text-ink-700"
            style={{ fontSize: 11 }}
          >
            Bal {row.runningBalance}
          </StyledText>
        </View>
      </View>
    </View>
  );
});

/* ─── Day separator ─────────────────────────────────────────────────── */

const DaySeparator = memo(function DaySeparator({ label, count }: { label: string; count: number }) {
  return (
    <View className="flex-row items-center bg-paper-100 border border-ink-100 rounded-xl px-3 py-2 mb-2.5">
      <View className="w-1.5 h-1.5 rounded-full bg-cinnamon-500 mr-2" />
      <StyledText variant="extrabold" className="label-caps text-ink-700">
        {label}
      </StyledText>
      {/* Spacer pushes the count to the far right edge. */}
      <View style={{ flex: 1 }} />
      <StyledText
        variant="medium"
        className="text-mono text-ink-500"
        style={{ fontSize: 11 }}
      >
        {count} {count === 1 ? 'entry' : 'entries'}
      </StyledText>
    </View>
  );
});

/* ─── No matches inline state ─────────────────────────────────────── */

const LedgerNoMatches = memo(function LedgerNoMatches() {
  return (
    <View className="items-center justify-center py-10 px-6 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <View className="w-12 h-12 rounded-full bg-paper-100 border border-ink-200 items-center justify-center mb-3">
        <FontAwesome name="search" size={18} color="#7A7165" />
      </View>
      <StyledText
        variant="extrabold"
        className="text-ink-700 text-base text-center"
      >
        No entries match your filter
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mt-1 text-center"
      >
        Try a different keyword or clear the filter to see everything.
      </StyledText>
    </View>
  );
});

/* ─── Pill + icon helpers (module-scope) ─────────────────────────── */

function EventPill({
  type,
  sign,
}: {
  type: InventoryEventType;
  sign?: 'positive' | 'negative' | null;
}) {
  switch (type) {
    case 'restock':
      return (
        <StatusPill variant="success" size="sm" dot>
          Restock
        </StatusPill>
      );
    case 'sale':
      return (
        <StatusPill variant="info" size="sm" dot>
          Sale
        </StatusPill>
      );
    case 'damaged':
      return (
        <StatusPill variant="danger" size="sm" dot>
          Damaged
        </StatusPill>
      );
    case 'adjustment':
      return (
        <StatusPill variant="warning" size="sm" dot>
          {sign === 'positive' ? 'Adjust (+)' : 'Adjust (−)'}
        </StatusPill>
      );
    default:
      return (
        <StatusPill variant="neutral" size="sm">
          Event
        </StatusPill>
      );
  }
}

function EventIcon({
  type,
  sign,
}: {
  type: InventoryEventType;
  sign?: 'positive' | 'negative' | null;
}) {
  switch (type) {
    case 'restock':
      return (
        <View className="w-9 h-9 rounded-full bg-sage-50 border border-sage-500 items-center justify-center">
          <Ionicons name="arrow-up-circle" size={20} color="#2F5C3E" />
        </View>
      );
    case 'sale':
      return (
        <View className="w-9 h-9 rounded-full bg-semantic-info-50 border border-semantic-info items-center justify-center">
          <Ionicons name="cart" size={20} color="#1F4E5B" />
        </View>
      );
    case 'damaged':
      return (
        <View className="w-9 h-9 rounded-full bg-semantic-danger-50 border border-semantic-danger items-center justify-center">
          <Ionicons name="warning" size={20} color="#C22D2D" />
        </View>
      );
    case 'adjustment':
      return (
        <View className="w-9 h-9 rounded-full bg-semantic-warning-50 border border-semantic-warning items-center justify-center">
          <Ionicons
            name={sign === 'positive' ? 'trending-up' : 'trending-down'}
            size={20}
            color="#C77B0E"
          />
        </View>
      );
    default:
      return (
        <View className="w-9 h-9 rounded-full bg-paper-100 border border-ink-300 items-center justify-center">
          <Ionicons name="cube" size={20} color="#7A7165" />
        </View>
      );
  }
}

/* ─── Pure helpers ────────────────────────────────────────────────── */

/** Signed quantity change for a transaction (+/− integer). */
function signedQuantity(tx: {
  type: InventoryEventType;
  quantity: number;
  adjustment_sign?: 'positive' | 'negative' | null;
}): number {
  if (tx.type === 'restock') return tx.quantity;
  if (tx.type === 'sale' || tx.type === 'damaged') return -tx.quantity;
  if (tx.type === 'adjustment') {
    return tx.adjustment_sign === 'negative' ? -tx.quantity : tx.quantity;
  }
  return 0;
}

type DayGroup = {
  key: string;
  label: string;
  entries: (InventoryTransaction & { runningBalance: number })[];
};

function groupByDay(
  rows: (InventoryTransaction & { runningBalance: number })[],
): DayGroup[] {
  const groups: Record<string, DayGroup> = {};
  const order: string[] = [];
  for (const row of rows) {
    const date = parseStoredTimestamp(row.timestamp);
    let key: string;
    let label: string;
    if (date && isValid(date)) {
      if (isToday(date)) {
        key = 'today';
        label = 'Today';
      } else if (isYesterday(date)) {
        key = 'yesterday';
        label = 'Yesterday';
      } else {
        key = format(date, 'yyyy-MM-dd');
        label = format(date, 'MMM dd');
      }
    } else {
      key = 'unknown';
      label = 'Earlier';
    }
    if (!groups[key]) {
      groups[key] = { key, label, entries: [] };
      order.push(key);
    }
    groups[key].entries.push(row);
  }
  return order.map((k) => groups[k]);
}

/**
 * `formatDateTime` — friendly relative-ish timestamp. SQLite stores
 * `timestamp` as `CURRENT_TIMESTAMP` (UTC); we accept both
 * space-separated and ISO forms and prefer date-fns for the output.
 * Format goal: scanable at a glance (`Today · 9:01 AM`,
 * `Yesterday · 4:15 PM`, `Jun 24 · 11:00 AM`).
 */
function formatDateTime(timestampStr: string): string {
  const d = parseStoredTimestamp(timestampStr);
  if (!d || !isValid(d)) {
    // Best-effort fallback for non-ISO pre-existing rows.
    const normalized = new Date(timestampStr.replace(' ', 'T') + 'Z');
    if (isValid(normalized)) return format(normalized, 'MMM dd · h:mm a');
    return timestampStr;
  }
  return format(d, 'h:mm a');
}
