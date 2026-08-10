import React from 'react';
import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { formatPesos } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface SaleRowProps {
  sale: SaleWithItems;
  onPress: (id: number) => void;
}

/**
 * SaleRow — modern digital receipt slip in the sales ledger.
 */
export const SaleRow = React.memo(function SaleRow({ sale, onPress }: SaleRowProps) {
  const isCredit = sale.payment_type === 'credit';
  const timestamp = parseStoredTimestamp(sale.timestamp) || new Date();
  const receiptRef = `#SR-${String(sale.id).padStart(4, '0')}`;
  const buyerName = sale.customer_name?.trim();

  // Format items preview snippet: e.g. "3 items • Item A, Item B..."
  const totalItems = sale.items_count || sale.items?.length || 0;
  const itemsCountLabel = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;

  const itemNames = (sale.items || [])
    .map((i) => i.product_name)
    .filter(Boolean);

  let itemsSnippet = itemsCountLabel;
  if (itemNames.length > 0) {
    const joinedNames = itemNames.slice(0, 3).join(', ');
    const hasMore = totalItems > 3 || itemNames.length > 3;
    itemsSnippet = `${itemsCountLabel} • ${joinedNames}${hasMore ? '...' : ''}`;
  }

  return (
    <Pressable
      onPress={() => onPress(sale.id)}
      accessibilityRole="button"
      accessibilityLabel={`Receipt ${receiptRef}, total ${formatPesos(sale.total)}`}
      className="mx-4 mb-3 bg-paper-100 border border-paper-300/60 rounded-2xl p-4 active:scale-[0.99] active:opacity-95 shadow-sm"
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Header Row: Reference ID + Date/Time */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center bg-paper-200/80 border border-paper-300 px-2.5 py-1 rounded-lg">
          <FontAwesome name="ticket" size={11} color="#564E45" style={{ marginRight: 6 }} />
          <StyledText variant="extrabold" className="text-mono text-ink-800 text-xs">
            {receiptRef}
          </StyledText>
        </View>

        <StyledText variant="medium" className="text-ink-500 text-xs">
          {format(timestamp, 'MMM dd, yyyy • hh:mm a')}
        </StyledText>
      </View>

      {/* Customer Tag + Payment Status Pill Row */}
      <View className="flex-row items-center justify-between mb-3">
        {buyerName ? (
          <View className="flex-row items-center bg-paper-200/60 border border-paper-300/70 rounded-full px-3 py-1 mr-2 flex-1 max-w-[70%]">
            <FontAwesome
              name={isCredit ? 'user' : 'user-o'}
              size={11}
              color={isCredit ? '#B45309' : '#564E45'}
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="extrabold"
              className="text-xs text-ink-800"
              numberOfLines={1}
            >
              {buyerName}
            </StyledText>
          </View>
        ) : (
          <View />
        )}

        {/* Payment Status Pill */}
        <View
          className={`flex-row items-center px-3 py-1 rounded-full border ${
            isCredit
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-700'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
          }`}
        >
          <FontAwesome
            name={isCredit ? 'credit-card' : 'money'}
            size={11}
            color={isCredit ? '#B45309' : '#047857'}
            style={{ marginRight: 5 }}
          />
          <StyledText
            variant="extrabold"
            className={`text-xs ${isCredit ? 'text-amber-700' : 'text-emerald-700'}`}
          >
            {isCredit ? 'UTANG' : 'CASH'}
          </StyledText>
        </View>
      </View>

      {/* Items Preview Snippet */}
      <View className="bg-paper-200/50 border border-paper-300/50 rounded-xl px-3 py-2 mb-3 flex-row items-center">
        <FontAwesome name="shopping-bag" size={11} color="#7A7165" style={{ marginRight: 8 }} />
        <StyledText variant="medium" className="text-ink-600 text-xs flex-1" numberOfLines={1}>
          {itemsSnippet}
        </StyledText>
      </View>

      {/* Dotted Divider */}
      <View className="border-b border-dashed border-paper-300 my-1" />

      {/* Total & Chevron Row */}
      <View className="flex-row items-center justify-between pt-2">
        <View>
          <StyledText variant="extrabold" className="label-caps text-ink-400 text-[10px]">
            Total
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-lg text-mono">
            {formatPesos(sale.total)}
          </StyledText>
        </View>

        <View className="flex-row items-center">
          <StyledText variant="semibold" className="text-xs text-persimmon-600 mr-1.5">
            View Details
          </StyledText>
          <View className="w-7 h-7 rounded-full bg-persimmon-50 border border-persimmon-200 items-center justify-center">
            <FontAwesome name="chevron-right" size={10} color="#E85A1F" />
          </View>
        </View>
      </View>
    </Pressable>
  );
});
