import React, { useMemo } from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import type { StockFilter } from './StockFilterChips';

interface StockEmptyStateProps {
  filter: StockFilter;
}

const PERFORATION_COUNT = 22;

const COPY: Record<StockFilter, { title: string; subtitle: string }> = {
  all: {
    title: 'No stock to show',
    subtitle: 'Add products or receive stock to see them here.',
  },
  critical: {
    title: 'Nothing critically low',
    subtitle: 'Stock levels look healthy for the critical band.',
  },
  low: {
    title: 'No low stock right now',
    subtitle: 'Products at or below 5 units will appear here.',
  },
  out: {
    title: 'Nothing is out of stock',
    subtitle: 'Out-of-stock items will be listed here as they happen.',
  },
  overstock: {
    title: 'No overstock today',
    subtitle: 'Items at or above 100 units will surface here.',
  },
  near_expiry: {
    title: 'Nothing near expiry',
    subtitle: 'Items expiring within 7 days will appear here.',
  },
};

export function StockEmptyState({ filter }: StockEmptyStateProps) {
  const copy = COPY[filter] ?? COPY.all;
  const perforations = useMemo(
    () => Array.from({ length: PERFORATION_COUNT }),
    [],
  );
  return (
    <View
      className="mx-4 mt-6 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between px-1"
          style={{ bottom: -6 }}
        >
          {perforations.map((_, i) => (
            <View
              key={`e-top-${i}`}
              className="w-3 h-3 rounded-full bg-paper-200"
            />
          ))}
        </View>
      </View>
      <View className="h-3" />

      <View className="items-center px-6 pt-2 pb-8">
        <View className="w-16 h-16 rounded-full bg-sage-50 border border-sage-200 items-center justify-center mb-4">
          <FontAwesome name="archive" size={28} color="#4F7A24" />
        </View>
        <StyledText
          variant="black"
          className="text-ink-900 text-h2 text-center px-4"
        >
          {copy.title}
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-500 text-body mt-2 text-center"
        >
          {copy.subtitle}
        </StyledText>
      </View>

      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between px-1"
          style={{ top: -6 }}
        >
          {perforations.map((_, i) => (
            <View
              key={`e-bot-${i}`}
              className="w-3 h-3 rounded-full bg-paper-200"
            />
          ))}
        </View>
      </View>
      <View className="h-3" />
    </View>
  );
}
