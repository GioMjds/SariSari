import { SalesFilterState } from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import { memo } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

interface FilterChipsProps {
  filters: SalesFilterState;
  onOpenMore: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const FilterChips = memo(function FilterChips({
  filters,
  onOpenMore,
  searchQuery = '',
  onSearchChange,
}: FilterChipsProps) {
  const hasActiveModalFilters =
    filters.paymentType !== 'all' || filters.dateRange !== 'all';

  return (
    <View className="mb-3">
      {/* Search input + Filter modal trigger button */}
      <View className="px-4 mb-3 flex-row items-center">
        <View className="flex-1 flex-row items-center bg-paper-100 border border-paper-300 rounded-2xl px-3.5 h-12 min-h-[44px]">
          <FontAwesome
            name="search"
            size={14}
            color="#7A7165"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search buyer, item, or receipt #..."
            placeholderTextColor="#9A9083"
            className="flex-1 py-2 text-sm text-ink-900 font-medium h-full"
            accessibilityLabel="Search receipts"
            returnKeyType="search"
          />
          {searchQuery.trim() !== '' && (
            <TouchableOpacity
              onPress={() => onSearchChange?.('')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Clear search"
              className="w-8 h-8 min-w-[32px] min-h-[32px] items-center justify-center rounded-full bg-paper-200 ml-1"
            >
              <FontAwesome name="times" size={12} color="#564E45" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={onOpenMore}
          activeOpacity={0.8}
          accessibilityLabel="Open filters"
          className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-2xl bg-paper-100 border border-paper-300 items-center justify-center ml-2.5 relative"
        >
          <FontAwesome
            name="sliders"
            size={16}
            color={hasActiveModalFilters ? '#E85A1F' : '#564E45'}
          />
          {hasActiveModalFilters && (
            <View className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-persimmon-500 border-2 border-paper-100" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});
