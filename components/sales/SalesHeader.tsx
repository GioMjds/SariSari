import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';

export type SalesSubTab = 'pos' | 'cart' | 'checkout' | 'receipts';

export interface SalesHeaderProps {
  todayTotal?: number;
  transactionCount?: number;
}

export function SalesHeader({
  todayTotal = 0,
  transactionCount,
}: SalesHeaderProps) {
  const todayFormatted = new Date()
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  return (
    <View className="px-4 pt-2">
      <View className="bg-cinnamon-500 rounded-3xl p-5 mb-3 shadow-lg border border-cinnamon-400/40 relative overflow-hidden">
        <View className="absolute -right-4 -bottom-4 opacity-15">
          <FontAwesome name="shopping-bag" size={140} color="#FFFFFF" />
        </View>

        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full border border-white/25">
            <FontAwesome
              name="calendar-check-o"
              size={12}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="extrabold"
              className="text-white text-[11px] tracking-wider uppercase"
            >
              TODAY&apos;S SALES
            </StyledText>
          </View>

          <View className="bg-white/15 px-2.5 py-1 rounded-full border border-white/20 flex-row items-center">
            <FontAwesome
              name="clock-o"
              size={10}
              color="#FFFFFF"
              style={{ marginRight: 4, opacity: 0.9 }}
            />
            <StyledText
              variant="extrabold"
              className="text-white/95 text-[10px] tracking-wider"
            >
              {todayFormatted}
            </StyledText>
          </View>
        </View>

        <View className="flex-row items-baseline mb-3">
          <StyledText
            variant="extrabold"
            className="text-white text-4xl tracking-tight"
          >
            {formatPesos(todayTotal)}
          </StyledText>
        </View>

        <View className="flex-row items-center gap-2">
          {transactionCount !== undefined ? (
            <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center border border-white/30">
              <FontAwesome
                name="file-text-o"
                size={10}
                color="#FFFFFF"
                style={{ marginRight: 5 }}
              />
              <StyledText variant="extrabold" className="text-white text-xs">
                {transactionCount} {transactionCount === 1 ? 'Txn' : 'Txns'}
              </StyledText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
