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
  { key: 'recent', label: 'Recent' },
  { key: 'with_balance', label: 'With Credit' },
  { key: 'paid', label: 'Fully Paid' },
  { key: 'loyal', label: 'Loyal' },
  { key: 'new', label: 'New' },
  { key: 'inactive', label: 'Inactive' },
] satisfies FilterChipOption[];

export const CustomerFilterChips: React.FC<CustomerFilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <View className="my-2">
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
              className={`mr-2 px-3 py-1.5 rounded-full border ${
                isActive
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-100 border-paper-300'
              }`}
            >
              <StyledText
                variant={isActive ? 'semibold' : 'regular'}
                className={`text-xs ${isActive ? 'text-white' : 'text-ink-500'}`}
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
