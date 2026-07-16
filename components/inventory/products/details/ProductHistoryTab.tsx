import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { format, isToday, isYesterday, isValid } from 'date-fns';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui';
import {
  InventoryTransaction,
  InventoryEventType,
} from '@/types/inventory.types';
import { parseStoredTimestamp } from '@/utils/timezone';

interface ProductHistoryTabProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  currentStock: number;
}

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

function formatDateTime(timestampStr: string): string {
  const d = parseStoredTimestamp(timestampStr);
  if (!d || !isValid(d)) {
    // Fallback
    const normalized = new Date(timestampStr.replace(' ', 'T') + 'Z');
    if (isValid(normalized)) return format(normalized, 'MMM dd · h:mm a');
    return timestampStr;
  }
  if (isToday(d)) {
    return `Today · ${format(d, 'h:mm a')}`;
  }
  if (isYesterday(d)) {
    return `Yesterday · ${format(d, 'h:mm a')}`;
  }
  return format(d, 'MMM dd · h:mm a');
}

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

export const ProductHistoryTab = React.memo(function ProductHistoryTab({
  transactions,
  isLoading,
  currentStock,
}: ProductHistoryTabProps) {
  const rowsWithBalance = useMemo(() => {
    const ordered = [...transactions].sort((a, b) => {
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
  }, [transactions, currentStock]);


  if (isLoading) {
    return (
      <View className="items-center justify-center py-12 px-8">
        <ActivityIndicator size="large" color="#E85A1F" />
        <StyledText variant="medium" className="text-ink-500 text-sm mt-3">
          Loading history...
        </StyledText>
      </View>
    );
  }

  if (rowsWithBalance.length === 0) {
    return (
      <View className="items-center justify-center py-12 px-6">
        <View className="w-16 h-16 rounded-full bg-paper-100 border border-ink-200 items-center justify-center mb-4">
          <Ionicons name="time-outline" size={32} color="#A89F90" />
        </View>
        <StyledText
          variant="extrabold"
          className="text-ink-700 text-base text-center mb-1"
        >
          No Stock Movements
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-400 text-sm text-center max-w-[260px]"
        >
          Recent transactions (sales, restocking, adjustments) will show up
          here.
        </StyledText>
      </View>
    );
  }

  return (
    <View className="pt-1 pb-2">
      {rowsWithBalance.map((item, index) => {
        const qty = signedQuantity(item);
        const positive = qty > 0;
        const noteTrimmed = item.note?.trim();
        const hasNote = !!noteTrimmed;
        const dateLabel = formatDateTime(item.timestamp);

        return (
          <MotiView
            key={`${item.id}-${item.timestamp}`}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 350,
              delay: Math.min(index * 40, 300),
            }}
            className="bg-white border border-ink-100 rounded-xl px-4 py-3 flex-row items-center mb-3 mx-4"
          >
            {/* Icon */}
            <View className="mr-3">
              <EventIcon type={item.type} sign={item.adjustment_sign} />
            </View>

            {/* Content */}
            <View className="flex-1 mr-2">
              <View className="flex-row items-center">
                <EventPill type={item.type} sign={item.adjustment_sign} />
              </View>
              {hasNote && (
                <StyledText
                  variant="semibold"
                  className="text-ink-800 text-xs mt-1"
                  numberOfLines={1}
                >
                  {noteTrimmed}
                </StyledText>
              )}
              <View className="flex-row items-center mt-1">
                <FontAwesome name="clock-o" size={9} color="#A89F90" />
                <StyledText
                  variant="medium"
                  className="text-ink-400 ml-1 text-[10px]"
                >
                  {dateLabel}
                </StyledText>
              </View>
            </View>

            {/* Quantity Badge & Running Balance */}
            <View className="items-end justify-center">
              <StyledText
                variant="black"
                className={`text-base font-extrabold ${
                  positive ? 'text-sage-700' : 'text-semantic-danger'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {positive ? '+' : ''}
                {qty}
              </StyledText>
              <View className="mt-1 px-2 py-0.5 rounded-full bg-paper-100 border border-ink-100">
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-[10px]"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  Bal: {item.runningBalance}
                </StyledText>
              </View>
            </View>
          </MotiView>
        );
      })}
    </View>
  );
});
