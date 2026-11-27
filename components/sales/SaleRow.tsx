import React from 'react';
import { SaleWithItems } from '@/types';
import { formatReceiptRef, getCancelledKind, parseStoredTimestamp } from '@/utils';
import { formatPesos } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface SaleRowProps {
  sale: SaleWithItems;
  onPress: (id: number) => void;
}

const BADGE = {
  cash: { label: 'CASH', icon: 'money', color: '#2C4413', box: 'bg-sage-50 border-sage-200', text: 'text-sage-700' },
  credit: { label: 'UTANG', icon: 'clock-o', color: '#8F5A0A', box: 'bg-semantic-warning-50 border-semantic-warning-100', text: 'text-semantic-warning-700' },
  cancelled: { label: '', icon: 'ban', color: '#28231D', box: 'bg-paper-200 border-ink-200', text: 'text-ink-700' },
} as const;

// Builds "3 items · Coke, Lucky Me +1 more" from the sale lines.
function itemsSummary(sale: SaleWithItems) {
  const count = sale.items_count || sale.items?.length || 0;
  const names = (sale.items ?? []).map((i) => i.product_name).filter(Boolean);
  const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;
  if (names.length === 0) return countLabel;
  const extra = Math.max(count, names.length) - 2;
  return `${countLabel} · ${names.slice(0, 2).join(', ')}${extra > 0 ? ` +${extra} more` : ''}`;
}

/**
 * SaleRow — compact ledger row: time and ref, buyer and status, items preview.
 */
export const SaleRow = React.memo(function SaleRow({ sale, onPress }: SaleRowProps) {
  const cancelled = getCancelledKind(sale);
  const badge = cancelled ? BADGE.cancelled : BADGE[sale.payment_type];
  const badgeLabel = cancelled?.stamp ?? badge.label;
  const timestamp = parseStoredTimestamp(sale.timestamp) || new Date();
  const time = format(timestamp, 'h:mm a');
  const ref = formatReceiptRef(sale.id);
  const buyer = sale.customer_name?.trim() || 'Walk-in';
  const items = itemsSummary(sale);
  const total = formatPesos(sale.total);

  return (
    <Pressable
      onPress={() => onPress(sale.id)}
      accessibilityRole="button"
      accessibilityLabel={`Receipt ${ref}, ${time}, ${buyer}, ${badgeLabel}, ${total}, ${items}`}
      accessibilityHint="Opens receipt details"
      className={`mx-4 mb-2 flex-row items-center rounded-card border px-4 py-3 ${
        cancelled ? 'bg-paper-100 border-ink-100 active:bg-paper-200' : 'bg-paper-50 border-ink-100 active:bg-paper-100'
      }`}
    >
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between">
          <StyledText
            variant="medium"
            numberOfLines={1}
            className="flex-1 mr-2 text-mono text-ink-500 text-xs"
          >
            {time} · {ref}
          </StyledText>
          <StyledText
            variant="extrabold"
            numberOfLines={1}
            className={`text-mono text-lg ${cancelled ? 'text-ink-500 line-through' : 'text-ink-900'}`}
          >
            {total}
          </StyledText>
        </View>

        <View className="flex-row items-center justify-between mt-0.5">
          <StyledText
            variant="semibold"
            numberOfLines={1}
            className={`flex-1 mr-3 text-sm ${sale.customer_name?.trim() ? 'text-ink-900' : 'text-ink-500'}`}
          >
            {buyer}
          </StyledText>
          <View className={`flex-row items-center rounded-md border px-2 py-0.5 ${badge.box}`}>
            <FontAwesome name={badge.icon} size={10} color={badge.color} style={{ marginRight: 4 }} />
            <StyledText variant="extrabold" className={`text-[11px] ${badge.text}`}>
              {badgeLabel}
            </StyledText>
          </View>
        </View>

        <StyledText variant="regular" numberOfLines={1} className="text-ink-500 text-xs mt-1">
          {items}
        </StyledText>
      </View>

      <FontAwesome name="chevron-right" size={11} color="#A89F90" style={{ marginLeft: 12 }} />
    </Pressable>
  );
});
