import { StyledText } from '@/components/elements';
import { useCategories } from '@/hooks/useCategories';
import { useInventoryOverview } from '@/hooks/useInventoryOverview';
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import type { AlertKind } from '../InventoryAlertPills';
import type { ProductsFilter } from './ProductFilterChips';

export interface ProductFiltersState {
  status: ProductsFilter;
  alert?: AlertKind | undefined;
  category?: string | undefined;
}

interface ProductFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: ProductFiltersState;
  onApplyFilters: (filters: ProductFiltersState) => void;
  onOpenAddCategory: () => void;
}

const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low Stock' },
  { key: 'out', label: 'Out of Stock' },
  { key: 'new', label: 'New' },
] satisfies { key: ProductsFilter; label: string }[];

const ALERT_OPTIONS = [
  {
    kind: 'low',
    label: 'Low Stock',
    icon: 'exclamation-triangle',
    color: '#B45309',
  },
  {
    kind: 'out',
    label: 'Out of Stock',
    icon: 'times-circle',
    color: '#BE123C',
  },
  {
    kind: 'near_expiry',
    label: 'Near Expiry',
    icon: 'clock-o',
    color: '#C2410C',
  },
  { kind: 'overstock', label: 'Overstock', icon: 'arrow-up', color: '#78350F' },
] satisfies {
  kind: AlertKind;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  color: string;
}[];

const PERFORATION_COUNT = 24;
const PERFORATION_BG = '#F7F6F2';

export function ProductFilterModal({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  onOpenAddCategory,
}: ProductFilterModalProps) {
  const [tempFilters, setTempFilters] =
    useState<ProductFiltersState>(currentFilters);
  const { getCategoriesWithCountQuery } = useCategories();
  const overview = useInventoryOverview();

  const categories = getCategoriesWithCountQuery.data ?? [];

  useEffect(() => {
    if (visible) setTempFilters(currentFilters);
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const reset: ProductFiltersState = {
      status: 'all',
      alert: undefined,
      category: undefined,
    };
    setTempFilters(reset);
    onApplyFilters(reset);
    onClose();
  };

  const getAlertCount = (kind: AlertKind) => {
    switch (kind) {
      case 'low':
        return overview.counts.low;
      case 'out':
        return overview.counts.out;
      case 'near_expiry':
        return overview.counts.nearExpiry;
      case 'overstock':
        return overview.counts.overstock;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
          <View className="flex-row justify-between items-center px-6 pt-4 pb-4">
            <View className="flex-1">
              <StyledText
                variant="extrabold"
                className="label-caps text-ink-500 mb-0.5"
              >
                Refine inventory list
              </StyledText>
              <StyledText
                variant="black"
                className="text-persimmon-600 text-2xl"
              >
                Filter Products
              </StyledText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close filter modal"
              className="w-9 h-9 justify-center items-center rounded-full bg-paper-200"
            >
              <FontAwesome name="times" size={16} color="#28231D" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="max-h-[32rem]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Section 1: Stock Status */}
            <View className="px-6 mb-5">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-4 bg-persimmon-500 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Stock Status
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = tempFilters.status === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.8}
                      onPress={() =>
                        setTempFilters((prev) => ({ ...prev, status: opt.key }))
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${opt.label} status filter`}
                      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                      className={`px-3.5 py-2.5 rounded-pill border justify-center ${
                        isSelected
                          ? 'bg-cinnamon-500 border-cinnamon-500'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                      >
                        {opt.label}
                      </StyledText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mx-6 divider-dotted-thin" />

            {/* Section 2: Inventory Health & Alerts */}
            <View className="px-6 my-5">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-4 bg-amber-500 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Inventory Alerts
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {ALERT_OPTIONS.map((alertOpt) => {
                  const isSelected = tempFilters.alert === alertOpt.kind;
                  const count = getAlertCount(alertOpt.kind);
                  return (
                    <TouchableOpacity
                      key={alertOpt.kind}
                      activeOpacity={0.8}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          alert: isSelected ? undefined : alertOpt.kind,
                        }))
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${alertOpt.label} alert filter, ${count} items`}
                      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                      className={`px-3.5 py-2.5 rounded-pill border flex-row items-center gap-1.5 ${
                        isSelected
                          ? 'bg-ink-900 border-ink-900'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <FontAwesome
                        name={alertOpt.icon}
                        size={12}
                        color={isSelected ? '#FBF7EE' : alertOpt.color}
                      />
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                      >
                        {alertOpt.label}
                      </StyledText>
                      <View
                        className={`px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-ink-700' : 'bg-paper-200'}`}
                      >
                        <StyledText
                          variant="extrabold"
                          className={`text-[10px] ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                        >
                          {count}
                        </StyledText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mx-6 divider-dotted-thin" />

            {/* Section 3: Categories */}
            <View className="px-6 mt-5">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-4 bg-persimmon-400 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Category
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {/* All Categories */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setTempFilters((prev) => ({ ...prev, category: undefined }))
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: !tempFilters.category }}
                  accessibilityLabel="All categories filter"
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  className={`px-3.5 py-2.5 rounded-pill border ${
                    !tempFilters.category
                      ? 'bg-ink-900 border-ink-900'
                      : 'bg-paper-100 border-ink-200'
                  }`}
                >
                  <StyledText
                    variant={!tempFilters.category ? 'extrabold' : 'medium'}
                    className={`text-xs ${!tempFilters.category ? 'text-paper-50' : 'text-ink-700'}`}
                  >
                    All Categories
                  </StyledText>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSelected =
                    tempFilters.category?.toLowerCase() ===
                    cat.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.8}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          category: isSelected ? undefined : cat.name,
                        }))
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${cat.name} category filter, ${cat.product_count} items`}
                      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                      className={`px-3.5 py-2.5 rounded-pill border flex-row items-center gap-1.5 ${
                        isSelected
                          ? 'bg-ink-900 border-ink-900'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                      >
                        {cat.name}
                      </StyledText>
                      <View
                        className={`px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-ink-700' : 'bg-paper-200'}`}
                      >
                        <StyledText
                          variant="extrabold"
                          className={`text-[10px] ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                        >
                          {cat.product_count}
                        </StyledText>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Add Category Pill */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    onOpenAddCategory();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add new category"
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  className="px-3.5 py-2.5 rounded-pill border border-dashed border-persimmon-400 bg-persimmon-50/50 flex-row items-center gap-1.5"
                >
                  <FontAwesome name="plus" size={10} color="#E85A1F" />
                  <StyledText
                    variant="extrabold"
                    className="text-xs text-persimmon-600"
                  >
                    Add Category
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Perforation edge */}
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

          {/* Actions */}
          <View className="flex-row gap-3 px-6 pt-4 pb-6 bg-paper-100 border-t border-dashed border-ink-200">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
              className="flex-1 bg-paper-50 border border-ink-200 rounded-2xl py-3.5 items-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-base">
                Reset
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
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
