import {
  DateRangeFilter,
  PaymentTypeFilter,
  SalesFilterState,
} from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyledText } from '@/components/elements';

interface FilterChipsProps {
  filters: SalesFilterState;
  onChange: (next: SalesFilterState) => void;
  onOpenMore: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onResetFilters?: () => void;
}

interface DateChipDef {
  value: DateRangeFilter;
  label: string;
}

interface PaymentChipDef {
  value: PaymentTypeFilter;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
}

const DATE_CHIPS: DateChipDef[] = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7d' },
  { value: 'last30days', label: 'Last 30d' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

const PAYMENT_CHIPS: PaymentChipDef[] = [
  { value: 'all', label: 'All', icon: 'list-ul' },
  { value: 'cash', label: 'Cash', icon: 'money' },
  { value: 'credit', label: 'Utang', icon: 'credit-card' },
];

export const FilterChips = React.memo(function FilterChips({
  filters,
  onChange,
  onOpenMore,
  searchQuery = '',
  onSearchChange,
  onResetFilters,
}: FilterChipsProps) {
  const hasActiveFilters =
    filters.paymentType !== 'all' ||
    filters.dateRange !== 'all' ||
    searchQuery.trim() !== '';

  const hasActiveModalFilters =
    filters.paymentType !== 'all' || filters.dateRange !== 'all';

  return (
    <View className="mb-3">
      {/* Search input + Filter modal trigger button */}
      <View className="px-4 mb-3 flex-row items-center">
        <View className="flex-1 flex-row items-center bg-paper-100 border border-paper-300 rounded-2xl px-3.5 h-12 min-h-[44px]">
          <FontAwesome name="search" size={14} color="#7A7165" style={{ marginRight: 8 }} />
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

      {/* Eyebrow Header with Dynamic Reset Button */}
      <View className="px-4 mb-2 flex-row items-center justify-between min-h-[36px]">
        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Payment & Date Filters
        </StyledText>
        {hasActiveFilters && onResetFilters && (
          <TouchableOpacity
            onPress={onResetFilters}
            activeOpacity={0.7}
            accessibilityLabel="Reset all filters"
            className="flex-row items-center px-3 py-2 min-h-[44px] rounded-xl bg-persimmon-50 border border-persimmon-200 active:bg-persimmon-100"
          >
            <FontAwesome name="undo" size={11} color="#E85A1F" style={{ marginRight: 5 }} />
            <StyledText variant="extrabold" className="text-persimmon-600 text-xs">
              Clear filters
            </StyledText>
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Type Pills (All, Cash, Utang) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
        style={{ flexGrow: 0 }}
        className="mb-2"
      >
        {PAYMENT_CHIPS.map((chip) => {
          const isActive = filters.paymentType === chip.value;
          return (
            <TouchableOpacity
              key={chip.value}
              activeOpacity={0.85}
              onPress={() => onChange({ ...filters, paymentType: chip.value })}
              accessibilityLabel={`Filter by ${chip.label}`}
              className={`mr-2.5 flex-row items-center px-4 py-2.5 min-h-[44px] rounded-full border ${
                isActive
                  ? 'bg-persimmon-500 border-persimmon-500 shadow-sm'
                  : 'bg-paper-100 border-paper-300'
              }`}
            >
              <FontAwesome
                name={chip.icon}
                size={12}
                color={isActive ? '#FBF7EE' : '#564E45'}
                style={{ marginRight: 6 }}
              />
              <StyledText
                variant={isActive ? 'extrabold' : 'medium'}
                className={`text-sm ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {chip.label}
              </StyledText>
              {isActive && (
                <View className="ml-2 w-1.5 h-1.5 rounded-full bg-paper-50" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date Range Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
        style={{ flexGrow: 0 }}
      >
        {DATE_CHIPS.map((chip) => {
          const isActive = filters.dateRange === chip.value;
          return (
            <TouchableOpacity
              key={chip.value}
              activeOpacity={0.85}
              onPress={() => onChange({ ...filters, dateRange: chip.value })}
              accessibilityLabel={`Filter by date ${chip.label}`}
              className={`mr-2 flex-row items-center px-4 py-2.5 min-h-[44px] rounded-full border ${
                isActive
                  ? 'bg-persimmon-500 border-persimmon-500 shadow-sm'
                  : 'bg-paper-100 border-paper-300'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'medium'}
                className={`text-sm ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {chip.label}
              </StyledText>
              {isActive && (
                <View className="ml-2 w-1.5 h-1.5 rounded-full bg-paper-50" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

