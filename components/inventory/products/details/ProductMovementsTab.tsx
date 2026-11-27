import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  LedgerEmptyState,
  LedgerRowsSkeleton,
} from '@/components/inventory/ledger';
import {
  bucketByDay,
  groupLedgerRows,
  readableNote,
  summarizeLedger,
  type LedgerRowData,
} from '@/components/inventory/ledger/ledgerMath';
import { StockStrip } from '@/components/inventory/ledger/StockStrip';
import type { InventoryEventType } from '@/types/inventory.types';

const TABULAR = StyleSheet.create({
  nums: { fontVariant: ['tabular-nums'] },
}).nums;
const STRIP_DAYS = 30;
// The full ledger screen owns search, filters and paging; this tab is a quick look.
const PREVIEW_LIMIT = 20;

type EventTone = {
  icon: keyof typeof Ionicons.glyphMap;
  iconClass: string;
  bg: string;
};

const EVENT_TONE: Record<InventoryEventType, EventTone> = {
  restock: { icon: 'arrow-down', iconClass: 'text-sage-600', bg: 'bg-sage-50' },
  sale: {
    icon: 'cart-outline',
    iconClass: 'text-semantic-info',
    bg: 'bg-semantic-info-50',
  },
  damaged: {
    icon: 'warning-outline',
    iconClass: 'text-semantic-danger',
    bg: 'bg-semantic-danger-50',
  },
  adjustment: {
    icon: 'swap-vertical',
    iconClass: 'text-semantic-warning',
    bg: 'bg-semantic-warning-50',
  },
};

interface ProductMovementsTabProps {
  rows: LedgerRowData[];
  isLoading: boolean;
  unitLabel: string;
  onOpenLedger: () => void;
  onRestock: () => void;
}

export const ProductMovementsTab = memo(function ProductMovementsTab({
  rows,
  isLoading,
  unitLabel,
  onOpenLedger,
  onRestock,
}: ProductMovementsTabProps) {
  const { t } = useTranslation('inventory');

  const { totals, buckets, sections } = useMemo(
    () => ({
      totals: summarizeLedger(rows),
      buckets: bucketByDay(rows, STRIP_DAYS),
      sections: groupLedgerRows(rows.slice(0, PREVIEW_LIMIT), {
        today: t('dayToday'),
        yesterday: t('dayYesterday'),
        earlier: t('dayEarlier'),
      }),
    }),
    [rows, t],
  );

  if (isLoading) return <LedgerRowsSkeleton />;
  if (rows.length === 0)
    return <LedgerEmptyState onLogTransaction={onRestock} />;

  return (
    <View className="pb-2">
      {/* 30-day summary */}
      <View className="mx-4 p-4 bg-paper-50 rounded-2xl border border-ink-100">
        <StyledText variant="extrabold" className="text-ink-900 text-sm mb-3">
          {t('ledger30Days')}
        </StyledText>
        <StockStrip
          buckets={buckets}
          accessibilityLabel={t('ledgerStripA11y', {
            added: totals.added,
            removed: totals.sold + totals.damaged,
          })}
        />
        <View className="flex-row mt-4">
          <Total
            label={t('movementFilterRestock')}
            value={`+${totals.added}`}
            tone="text-sage-700"
          />
          <Total
            label={t('movementFilterSale')}
            value={`−${totals.sold}`}
            tone="text-ink-900"
          />
          <Total
            label={t('movementFilterDamaged')}
            value={`−${totals.damaged}`}
            tone={totals.damaged > 0 ? 'text-semantic-danger' : 'text-ink-900'}
          />
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.key}>
          <View
            accessibilityRole="header"
            className="px-6 pt-5 pb-2 flex-row items-center justify-between"
          >
            <StyledText variant="extrabold" className="text-ink-700 text-sm">
              {section.title}
            </StyledText>
            <StyledText
              variant="semibold"
              className={`text-xs ${
                section.net > 0
                  ? 'text-sage-700'
                  : section.net < 0
                    ? 'text-semantic-danger'
                    : 'text-ink-500'
              }`}
              style={TABULAR}
            >
              {t('ledgerDayNet', {
                value: `${section.net > 0 ? '+' : ''}${section.net}`,
              })}
            </StyledText>
          </View>
          {section.data.map((row, i) => (
            <MovementRow
              key={`${row.type}-${row.id}-${row.time}`}
              row={row}
              unitLabel={unitLabel}
              isFirst={i === 0}
              isLast={i === section.data.length - 1}
            />
          ))}
        </View>
      ))}

      {rows.length > PREVIEW_LIMIT && (
        <StyledText
          variant="medium"
          className="text-ink-500 text-xs text-center mt-4"
        >
          {t('details_showingLatest', { count: PREVIEW_LIMIT })}
        </StyledText>
      )}

      <Pressable
        onPress={onOpenLedger}
        accessibilityRole="button"
        className="mx-4 mt-4 min-h-[48px] rounded-xl border border-ink-200 bg-paper-50 flex-row items-center justify-center active:opacity-80"
      >
        <Ionicons name="list-outline" size={16} className="text-cinnamon-500" />
        <StyledText
          variant="extrabold"
          className="text-cinnamon-700 text-sm ml-2"
        >
          {t('details_openLedger')}
        </StyledText>
      </Pressable>
    </View>
  );
});

function Total({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      className="flex-1"
    >
      <StyledText variant="semibold" className="text-ink-500 text-xs">
        {label}
      </StyledText>
      <StyledText variant="black" className={`text-lg ${tone}`} style={TABULAR}>
        {value}
      </StyledText>
    </View>
  );
}

// Grouped-card row shared by the Movements tab and the Overview preview.
export const MovementRow = memo(function MovementRow({
  row,
  unitLabel,
  isFirst,
  isLast,
}: {
  row: LedgerRowData;
  unitLabel: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation('inventory');
  const tone = EVENT_TONE[row.type] ?? EVENT_TONE.adjustment;
  const note = readableNote(row.note, t);
  const positive = row.signed > 0;
  const typeLabel = t(`movementType_${row.type}`, {
    defaultValue: t('movementType_other'),
  });
  const qtyText = `${positive ? '+' : ''}${row.signed}`;
  const balanceText = t('ledgerBalanceAfter', { count: row.balance });

  return (
    <View
      accessible
      accessibilityLabel={[
        typeLabel,
        `${qtyText} ${unitLabel}`,
        row.timeLabel,
        balanceText,
        note,
      ]
        .filter(Boolean)
        .join(', ')}
      className={`mx-4 px-4 py-3 bg-paper-50 border-x border-ink-100 flex-row items-center ${
        isFirst ? 'rounded-t-2xl border-t' : ''
      } ${isLast ? 'rounded-b-2xl border-b' : 'border-b border-b-paper-300'}`}
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${tone.bg}`}
      >
        <Ionicons name={tone.icon} size={18} className={tone.iconClass} />
      </View>
      <View className="flex-1 mx-3">
        <StyledText
          variant="semibold"
          className="text-ink-900 text-sm"
          numberOfLines={1}
        >
          {typeLabel}
        </StyledText>
        {note ? (
          <StyledText
            variant="regular"
            className="text-ink-600 text-sm mt-0.5"
            numberOfLines={2}
          >
            {note}
          </StyledText>
        ) : null}
        <StyledText
          variant="medium"
          className="text-ink-400 text-xs mt-0.5"
          style={TABULAR}
        >
          {row.timeLabel}
        </StyledText>
      </View>
      <View className="items-end">
        <StyledText
          variant="black"
          className={`text-base ${positive ? 'text-sage-600' : 'text-semantic-danger'}`}
          style={TABULAR}
        >
          {qtyText}
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-500 text-xs mt-0.5"
          style={TABULAR}
        >
          {balanceText}
        </StyledText>
      </View>
    </View>
  );
});
