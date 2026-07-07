import React from 'react';
import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, StatusStamp } from '@/components/ui';
import { PerforationRow } from './PerforationRow';

interface SaleRowProps {
  sale: SaleWithItems;
  onPress: (id: number) => void;
}

/**
 * SaleRow — a perforated paper-receipt row in the resibo book.
 *
 * Buyer chip is shown for ALL sales with a captured `customer_name`:
 *   • Credit  → warm orange paper-200 chip with a user glyph (matches
 *               the historical "Bill to" reading on the receipt).
 *   • Cash    → neutral ink chip with a user-o glyph so the buyer
 *               doesn't compete with the primary CASH status stamp.
 *
 * No business logic, no animation — kept pure so the parent FlatList
 * can wrap it in MotiView with a per-row stagger.
 */
export const SaleRow = React.memo(function SaleRow({ sale, onPress }: SaleRowProps) {
  const isCredit = sale.payment_type === 'credit';
  const stampTone: 'persimmon' | 'sage' = isCredit ? 'persimmon' : 'sage';
  const stampLabel = isCredit ? 'UTANG' : 'CASH';
  const stampRotate = isCredit ? -8 : 6;
  const timestamp = parseStoredTimestamp(sale.timestamp) || new Date();
  const itemsLabel = `${sale.items_count} ${sale.items_count === 1 ? 'item' : 'items'}`;
  const buyerName = sale.customer_name?.trim();
  const showBuyerChip = !!buyerName;

  return (
    <Pressable
      onPress={() => onPress(sale.id)}
      className="mx-4 mb-4 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <PerforationRow side="top" />

      <View className="paper-texture px-5 pt-4 pb-5">
        {/* Top row — date & stamp */}
        <View className="flex-row items-start justify-between mb-1">
          <View className="flex-1 mr-3">
            <StyledText
              variant="semibold"
              className="text-ink-900 text-base mt-0.5"
            >
              {format(timestamp, 'MMM dd, yyyy')}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs mt-0.5"
            >
              {format(timestamp, 'hh:mm a')}
            </StyledText>
          </View>

          <StatusStamp
            label={stampLabel}
            tone={stampTone}
            size="sm"
            rotate={stampRotate}
          />
        </View>

        {/* Buyer chip — credit (warm) or cash (neutral). Always shown
            when a name was captured, so the sales history doubles as a
            lookup tool for "who bought this?" at the counter. */}
        {showBuyerChip && (
          <View
            className={`self-start flex-row items-center rounded-pill px-3 py-1 mt-2 ${
              isCredit
                ? 'bg-paper-200'
                : 'bg-ink-100'
            }`}
          >
            <FontAwesome
              name={isCredit ? 'user' : 'user-o'}
              size={11}
              color={isCredit ? '#564E45' : '#7A7165'}
            />
            <StyledText
              variant="medium"
              className={`text-xs ml-1.5 ${
                isCredit ? 'text-ink-700' : 'text-ink-500'
              }`}
              numberOfLines={1}
            >
              {buyerName}
            </StyledText>
            {!isCredit && sale.customer_credit_id == null && (
              <StyledText
                variant="medium"
                className="text-[10px] label-caps text-ink-400 ml-1.5"
              >
                · one-off
              </StyledText>
            )}
          </View>
        )}

        {/* Dotted divider */}
        <View className="divider-dotted-thin my-4" />

        {/* Total + items */}
        <View className="flex-row items-end justify-between">
          <View className="flex-row items-baseline">
            <MoneyText value={sale.total} size="xl" className="text-ink-900" />
          </View>

          <View className="items-end">
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              Qty
            </StyledText>
            <StyledText
              variant="semibold"
              className="text-mono text-ink-700 mt-0.5"
            >
              {itemsLabel}
            </StyledText>
          </View>
        </View>
      </View>

      <PerforationRow side="bottom" />
      <View className="h-3" />
    </Pressable>
  );
})