import {
  DateRangeFilter,
  dateRangeOptions,
  PaymentTypeFilter,
  SalesFilterState,
} from '@/constants';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { memo } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

interface FilterChipsProps {
  filters: SalesFilterState;
  onOpenMore: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenCorrectionsReport?: () => void;
  onFiltersChange?: (filters: SalesFilterState) => void;
}

const PAYMENT_CHIPS: { value: PaymentTypeFilter; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Utang' },
];
const QUICK_DATES: DateRangeFilter[] = ['today', 'last7days', 'thisMonth'];
const dateLabel = (value: DateRangeFilter) =>
  dateRangeOptions.find((o) => o.value === value)?.label ?? value;

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filter ${label}`}
      className={`flex-row items-center min-h-9 py-1.5 px-3.5 rounded-pill border ${
        selected
          ? 'bg-persimmon-50 border-persimmon-500'
          : 'bg-paper-50 border-ink-200'
      }`}
    >
      {selected && (
        <FontAwesome
          name="check"
          size={10}
          color="#A1370C"
          style={{ marginRight: 6 }}
        />
      )}
      <StyledText
        variant={selected ? 'extrabold' : 'medium'}
        className={`text-sm ${selected ? 'text-persimmon-700' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
    </TouchableOpacity>
  );
}

export const FilterChips = memo(function FilterChips({
  filters,
  onOpenMore,
  searchQuery = '',
  onSearchChange,
  onOpenCorrectionsReport,
  onFiltersChange,
}: FilterChipsProps) {
  const activeCount =
    Number(filters.paymentType !== 'all') + Number(filters.dateRange !== 'all');
  const hasActiveModalFilters = activeCount > 0;
  // A range picked in the modal that has no quick chip shows up first as an active chip.
  const dateChips =
    filters.dateRange !== 'all' && !QUICK_DATES.includes(filters.dateRange)
      ? [filters.dateRange, ...QUICK_DATES]
      : QUICK_DATES;

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
            placeholderTextColor="#564E45"
            className="flex-1 py-2 text-sm text-ink-900 font-medium h-full"
            accessibilityLabel="Search receipts"
            returnKeyType="search"
          />
          {searchQuery.trim() !== '' && (
            <TouchableOpacity
              onPress={() => onSearchChange?.('')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
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
          accessibilityRole="button"
          accessibilityLabel={
            hasActiveModalFilters
              ? `Open filters, ${activeCount} active`
              : 'Open filters'
          }
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

        {onOpenCorrectionsReport && (
          <TouchableOpacity
            onPress={onOpenCorrectionsReport}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Corrections audit log"
            className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-2xl bg-paper-100 border border-paper-300 items-center justify-center ml-2 relative"
          >
            <FontAwesome name="history" size={16} color="#564E45" />
          </TouchableOpacity>
        )}
      </View>

      {onFiltersChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            alignItems: 'center',
          }}
        >
          {PAYMENT_CHIPS.map((chip) => {
            const selected = filters.paymentType === chip.value;
            return (
              <Chip
                key={chip.value}
                label={chip.label}
                selected={selected}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    paymentType: selected ? 'all' : chip.value,
                  })
                }
              />
            );
          })}
          <View className="w-px h-5 bg-ink-200 mx-1" />
          {dateChips.map((value) => {
            const selected = filters.dateRange === value;
            return (
              <Chip
                key={value}
                label={dateLabel(value)}
                selected={selected}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    dateRange: selected ? 'all' : value,
                  })
                }
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});
