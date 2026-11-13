import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

export type CustomerListFilter = 'all' | 'with_balance' | 'paid';

interface CustomerFilterChipsProps {
  activeFilter: CustomerListFilter;
  onSelectFilter: (filter: CustomerListFilter) => void;
  counts: Record<CustomerListFilter, number>;
}

const FILTER_OPTIONS = [
  { key: 'all', labelKey: 'filterAll' },
  { key: 'with_balance', labelKey: 'filterWithUtang' },
  { key: 'paid', labelKey: 'filterPaidUp' },
] as const satisfies readonly { key: CustomerListFilter; labelKey: string }[];

export const CustomerFilterChips: React.FC<CustomerFilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const { t } = useTranslation('utang');

  return (
    <View className="mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTER_OPTIONS.map((item) => {
          const isActive = activeFilter === item.key;
          const label = t(item.labelKey);
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectFilter(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label}, ${counts[item.key]}`}
              className={`min-h-11 px-4 rounded-full border flex-row items-center active:opacity-80 ${
                isActive
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-50 border-ink-300'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                className={`text-sm ${isActive ? 'text-white' : 'text-ink-700'}`}
              >
                {label}
              </StyledText>
              <StyledText
                variant="semibold"
                className={`text-sm ml-1.5 ${
                  isActive ? 'text-cinnamon-50' : 'text-ink-400'
                }`}
              >
                {counts[item.key]}
              </StyledText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
