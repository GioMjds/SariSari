import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { StyledText } from '@/components/elements';
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

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2'; // page bg = paper-200, so circles look bitten out

/**
 * Reskin of the original sales filter sheet. Now reads as a paper sheet
 * torn from the resibo book — cream surface, paper-200 perforations on
 * the bottom edge, persimmon "Apply" with brand-tinted glow.
 */
export default function SalesFilterModal({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
}: SalesFilterModalProps) {
  const [tempFilters, setTempFilters] =
    useState<SalesFilterState>(currentFilters);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: SalesFilterState = {
      paymentType: 'all',
      dateRange: 'all',
    };
    setTempFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          className="w-full bg-paper-50 rounded-t-3xl overflow-hidden"
          style={{
            shadowColor: '#564E45',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.16,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
            <View className="flex-1">
              <StyledText
                variant="extrabold"
                className="label-caps text-ink-400 mb-1"
              >
                Refine your ledger
              </StyledText>
              <StyledText
                variant="black"
                className="text-persimmon-600 text-2xl"
              >
                Filter Sales
              </StyledText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              className="w-9 h-9 justify-center items-center rounded-full bg-paper-200"
            >
              <FontAwesome name="times" size={16} color="#28231D" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="max-h-[26rem]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Payment Type Filter */}
            <View className="px-6 mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-4 bg-persimmon-500 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Payment Type
                </StyledText>
              </View>
              <View className="gap-2">
                {paymentTypeOptions.map((option) => {
                  const isSelected = tempFilters.paymentType === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.85}
                      onPress={() =>
                        setTempFilters({
                          ...tempFilters,
                          paymentType: option.value,
                        })
                      }
                      className={`flex-row items-center px-4 py-3.5 rounded-2xl border ${
                        isSelected
                          ? 'bg-persimmon-50 border-2 border-persimmon-500'
                          : 'bg-paper-100 border border-ink-200'
                      }`}
                    >
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                          isSelected ? 'bg-persimmon-500' : 'bg-paper-200'
                        }`}
                      >
                        <FontAwesome
                          name={option.icon}
                          size={15}
                          color={isSelected ? '#FBF7EE' : '#564E45'}
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
                        <View className="w-6 h-6 rounded-full bg-persimmon-500 items-center justify-center">
                          <FontAwesome name="check" size={12} color="#FBF7EE" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dotted divider */}
            <View className="mx-6 divider-dotted-thin" />

            {/* Date Range Filter */}
            <View className="px-6 mt-6">
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-4 bg-cinnamon-500 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Date Range
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {dateRangeOptions.map((option) => {
                  const isSelected = tempFilters.dateRange === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.85}
                      onPress={() =>
                        setTempFilters({
                          ...tempFilters,
                          dateRange: option.value,
                        })
                      }
                      className={`px-4 py-2.5 rounded-pill border ${
                        isSelected
                          ? 'bg-cinnamon-500 border-cinnamon-500 shadow-paper'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-sm ${
                          isSelected ? 'text-paper-50' : 'text-ink-700'
                        }`}
                      >
                        {option.label}
                      </StyledText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom perforation row — bites up into the body so the sheet looks torn out */}
          <View className="relative h-0">
            <View
              className="absolute left-0 right-0 h-3 flex-row justify-between"
              style={{ top: -6 }}
            >
              {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
                <View
                  key={`mp-${i}`}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PERFORATION_BG }}
                />
              ))}
            </View>
          </View>
          <View className="h-3" />

          {/* Action Buttons */}
          <View className="flex-row gap-3 px-6 pt-4 pb-6 bg-paper-100 border-t border-dashed border-ink-200">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReset}
              className="flex-1 bg-paper-50 border border-ink-200 rounded-2xl py-3.5 items-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-base">
                Reset
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              className="flex-1 bg-persimmon-500 rounded-2xl py-3.5 items-center"
              style={{
                shadowColor: '#E85A1F',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-base"
              >
                Apply Filters
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
