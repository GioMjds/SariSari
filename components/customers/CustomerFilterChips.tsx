import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { ExtendedCreditFilter } from '@/types/credits.types';

interface FilterChipOption {
  key: ExtendedCreditFilter;
  label: string;
}

interface CustomerFilterChipsProps {
  activeFilter: ExtendedCreditFilter;
  onSelectFilter: (filter: ExtendedCreditFilter) => void;
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'with_balance', label: 'With Credit' },
  { key: 'loyal', label: 'Loyal' },
  { key: 'recent', label: 'Recent' },
  { key: 'paid', label: 'Fully Paid' },
  { key: 'new', label: 'New' },
] satisfies FilterChipOption[];

export const CustomerFilterChips: React.FC<CustomerFilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {FILTER_OPTIONS.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => onSelectFilter(item.key)}
              className={`mr-2.5 px-4 py-2 rounded-full border ${
                isActive
                  ? 'bg-ink-900 border-ink-900 shadow-sm'
                  : 'bg-paper-100 border-paper-200'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                className={`text-xs ${isActive ? 'text-white' : 'text-ink-700'}`}
              >
                {item.label}
              </StyledText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
