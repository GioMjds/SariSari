import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyledText } from '@/components/elements';

export type AlertCategory =
  'all' | 'low_stock' | 'expiring' | 'overdue_debts' | 'unsynced';

export interface AlertFilterPillsProps {
  activeCategory: AlertCategory;
  onSelectCategory: (category: AlertCategory) => void;
}

interface Category {
  key: AlertCategory;
  label: string;
}

export function AlertFilterPills({
  activeCategory,
  onSelectCategory,
}: AlertFilterPillsProps) {
  const categories = [
    { key: 'all', label: 'All' },
    { key: 'low_stock', label: 'Low Stock' },
    { key: 'expiring', label: 'Expiring' },
    { key: 'overdue_debts', label: 'Overdue Debts' },
    { key: 'unsynced', label: 'Unsynced' },
  ] satisfies Category[];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 mb-4 flex-row"
    >
      <View
        accessibilityRole="tablist"
        className="flex-row gap-2"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => onSelectCategory(cat.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${cat.label} filter`}
              className={`px-4 min-h-[44px] justify-center rounded-full border ${
                isActive
                  ? 'bg-cinnamon-500 border-cinnamon-600'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'medium'}
                className={`text-xs ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {cat.label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
