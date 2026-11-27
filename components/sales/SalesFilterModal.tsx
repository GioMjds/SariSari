import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import {
  dateRangeOptions,
  paymentTypeOptions,
  SalesFilterState,
} from '@/constants';

interface SalesFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: SalesFilterState;
  onApplyFilters: (filters: SalesFilterState) => void;
}

const ALL_FILTERS: SalesFilterState = { paymentType: 'all', dateRange: 'all' };

export function SalesFilterModal({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
}: SalesFilterModalProps) {
  const [tempFilters, setTempFilters] =
    useState<SalesFilterState>(currentFilters);

  // Quick chips can change filters while the sheet is closed, so resync on open.
  useEffect(() => {
    if (visible) setTempFilters(currentFilters);
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    setTempFilters(ALL_FILTERS);
    onApplyFilters(ALL_FILTERS);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Filter receipts">
      <View accessibilityRole="radiogroup" accessibilityLabel="Payment type">
        <StyledText variant="extrabold" className="text-ink-900 text-sm mb-2">
          Payment type
        </StyledText>
        <View className="gap-2">
          {paymentTypeOptions.map((option) => {
            const isSelected = tempFilters.paymentType === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setTempFilters({ ...tempFilters, paymentType: option.value })
                }
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.label}
                className={`flex-row items-center min-h-12 px-3 py-2 rounded-xl border ${
                  isSelected
                    ? 'bg-persimmon-50 border-persimmon-500'
                    : 'bg-paper-100 border-ink-200 active:bg-paper-200'
                }`}
              >
                <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-paper-50 border border-ink-100">
                  <FontAwesome
                    name={option.icon}
                    size={14}
                    color={isSelected ? '#A1370C' : '#564E45'}
                  />
                </View>
                <StyledText
                  variant={isSelected ? 'extrabold' : 'medium'}
                  className={`flex-1 text-base ${
                    isSelected ? 'text-persimmon-700' : 'text-ink-900'
                  }`}
                >
                  {option.label}
                </StyledText>
                {isSelected && (
                  <FontAwesome name="check" size={14} color="#A1370C" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Date range">
        <StyledText variant="extrabold" className="text-ink-900 text-sm mb-2">
          Date range
        </StyledText>
        <View className="flex-row flex-wrap gap-2">
          {dateRangeOptions.map((option) => {
            const isSelected = tempFilters.dateRange === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setTempFilters({ ...tempFilters, dateRange: option.value })
                }
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.label}
                className={`flex-row items-center min-h-11 px-4 py-2 rounded-pill border ${
                  isSelected
                    ? 'bg-persimmon-50 border-persimmon-500'
                    : 'bg-paper-100 border-ink-200 active:bg-paper-200'
                }`}
              >
                {isSelected && (
                  <FontAwesome
                    name="check"
                    size={11}
                    color="#A1370C"
                    style={{ marginRight: 6 }}
                  />
                )}
                <StyledText
                  variant={isSelected ? 'extrabold' : 'medium'}
                  className={`text-sm ${
                    isSelected ? 'text-persimmon-700' : 'text-ink-700'
                  }`}
                >
                  {option.label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row gap-3 pt-3 border-t border-dashed border-ink-200">
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityHint="Shows all receipts and closes the filters"
          className="flex-1 min-h-12 bg-paper-50 border border-ink-200 rounded-xl items-center justify-center active:bg-paper-200"
        >
          <StyledText variant="semibold" className="text-ink-800 text-base">
            Reset
          </StyledText>
        </Pressable>
        <Pressable
          onPress={handleApply}
          accessibilityRole="button"
          className="flex-1 min-h-12 bg-persimmon-600 active:bg-persimmon-700 rounded-xl items-center justify-center"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            Apply filters
          </StyledText>
        </Pressable>
      </View>
    </Sheet>
  );
}
