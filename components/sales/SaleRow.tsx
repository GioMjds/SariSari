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
 * SaleRow — modern thermal receipt card in the sales ledger.
 * High visual contrast, structured item previews, clear buyer attribution,
 * and tactile perforated receipt edges.
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
  const receiptRef = `#SR-${String(sale.id).padStart(4, '0')}`;

  const previewItems = sale.items?.slice(0, 3) || [];
  const remainingCount = (sale.items_count || sale.items?.length || 0) - previewItems.length;

  return (
    <Pressable
      onPress={() => onPress(sale.id)}
      className="mx-4 mb-4 rounded-3xl overflow-hidden bg-paper-50 border border-ink-200/80 active:scale-[0.98] active:opacity-95"
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
        {/* Receipt Serial & Status Stamp Row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center bg-paper-100/90 border border-ink-200 px-2.5 py-1 rounded-lg">
            <FontAwesome name="ticket" size={11} color="#564E45" style={{ marginRight: 6 }} />
            <StyledText variant="bold" className="text-mono text-ink-700 text-xs">
              {receiptRef}
            </StyledText>
          </View>

          <StatusStamp
            label={stampLabel}
            tone={stampTone}
            size="sm"
            rotate={stampRotate}
          />
        </View>

        {/* Date, Time & Buyer Info */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-2">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              {format(timestamp, 'MMM dd, yyyy')}
            </StyledText>
            <StyledText variant="medium" className="text-ink-500 text-xs mt-0.5">
              {format(timestamp, 'hh:mm a')}
            </StyledText>
          </View>

          {showBuyerChip && (
            <View
              className={`flex-row items-center rounded-pill px-3 py-1.5 border ${
                isCredit
                  ? 'bg-persimmon-100 border-persimmon-300'
                  : 'bg-paper-100 border-ink-200'
              }`}
            >
              <FontAwesome
                name={isCredit ? 'user' : 'user-o'}
                size={11}
                color={isCredit ? '#A1370C' : '#564E45'}
              />
              <StyledText
                variant="extrabold"
                className={`text-xs ml-1.5 ${
                  isCredit ? 'text-persimmon-900' : 'text-ink-800'
                }`}
                numberOfLines={1}
              >
                {buyerName}
              </StyledText>
            </View>
          )}
        </View>

        {/* Line Items Preview Card */}
        {previewItems.length > 0 && (
          <View className="bg-paper-100/90 border border-ink-200/70 rounded-2xl p-3 my-1">
            {previewItems.map((item, idx) => (
              <View
                key={item.id || idx}
                className={`flex-row items-center justify-between py-1 ${
                  idx > 0 ? 'border-t border-ink-100/60' : ''
                }`}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="bg-persimmon-100 border border-persimmon-200/80 px-1.5 py-0.5 rounded-md mr-2">
                    <StyledText variant="extrabold" className="text-persimmon-800 text-[11px]">
                      {item.quantity}x
                    </StyledText>
                  </View>
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-xs flex-1"
                    numberOfLines={1}
                  >
                    {item.product_name}
                  </StyledText>
                </View>
                <StyledText variant="bold" className="text-mono text-ink-700 text-xs">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </StyledText>
              </View>
            ))}

            {remainingCount > 0 && (
              <View className="pt-1.5 mt-1 border-t border-ink-100/60 flex-row items-center justify-between">
                <StyledText variant="semibold" className="text-ink-500 text-[11px] italic">
                  + {remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                </StyledText>
                <FontAwesome name="ellipsis-h" size={10} color="#7A7165" />
              </View>
            )}
          </View>
        )}

        {/* Dotted divider */}
        <View className="divider-dotted-thin my-3" />

        {/* Total & Detail Action */}
        <View className="flex-row items-center justify-between">
          <View>
            <StyledText variant="extrabold" className="label-caps text-ink-400 text-[10px]">
              Total Paid
            </StyledText>
            <MoneyText value={sale.total} size="xl" className="text-ink-900 font-extrabold" />
          </View>

          <View className="flex-row items-center">
            <View className="items-end mr-3">
              <StyledText variant="extrabold" className="label-caps text-ink-400 text-[10px]">
                Items
              </StyledText>
              <StyledText variant="extrabold" className="text-mono text-ink-800 text-xs">
                {itemsLabel}
              </StyledText>
            </View>
            <View className="w-9 h-9 rounded-full bg-persimmon-50 border border-persimmon-200 items-center justify-center shadow-sm">
              <FontAwesome name="chevron-right" size={12} color="#E85A1F" />
            </View>
          </View>
        </View>
      </View>

      <PerforationRow side="bottom" />
      <View className="h-2" />
    </Pressable>
  );
});