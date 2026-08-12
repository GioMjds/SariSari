import { StyledText } from '@/components/elements';
import { useCategories } from '@/hooks/useCategories';
import { useInventoryOverview } from '@/hooks/useInventoryOverview';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AlertKind } from '../InventoryAlertPills';
import { FilterPill } from './FilterPill';
import type { ProductsFilter } from './ProductFilterChips';

export interface ProductFiltersState {
  status: ProductsFilter;
  alert?: AlertKind | undefined;
  alertList?: AlertKind[];
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
    kind: 'low' as const,
    label: 'Low Stock',
    icon: 'exclamation-triangle' as const,
    color: '#B45309',
  },
  {
    kind: 'out' as const,
    label: 'Out of Stock',
    icon: 'times-circle' as const,
    color: '#BE123C',
  },
  {
    kind: 'near_expiry' as const,
    label: 'Near Expiry',
    icon: 'clock-o' as const,
    color: '#C2410C',
  },
  {
    kind: 'overstock' as const,
    label: 'Overstock',
    icon: 'arrow-up' as const,
    color: '#78350F',
  },
] as const;

const PERFORATION_DOTS = Array.from({ length: 24 }, (_, i) => i);
const RESET_ARM_MS = 4000;

type SectionAccent = 'persimmon-500' | 'amber-500' | 'persimmon-400';

const SECTION_ACCENT_COLOR: Record<SectionAccent, string> = {
  'persimmon-500': '#E85A1F',
  'amber-500': '#C77B0E',
  'persimmon-400': '#FA7A4B',
};

function SectionHeader({
  label,
  accent,
  hint,
}: {
  label: string;
  accent: SectionAccent;
  hint?: string;
}) {
  return (
    <View className="flex-row items-center mb-2.5">
      <View
        className="w-1 h-4 rounded-full mr-2"
        style={{ backgroundColor: SECTION_ACCENT_COLOR[accent] }}
      />
      <StyledText variant="extrabold" className="label-caps text-ink-700">
        {label}
      </StyledText>
      {hint ? (
        <StyledText
          variant="medium"
          className="label-caps text-ink-400 ml-2"
        >
          {hint}
        </StyledText>
      ) : null}
    </View>
  );
}

function usePrefersReducedMotion(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (active) setEnabled(isEnabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        if (active) setEnabled(isEnabled);
      },
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return enabled;
}

export function ProductFilterModal({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  onOpenAddCategory,
}: ProductFilterModalProps) {
  const [tempFilters, setTempFilters] =
    useState<ProductFiltersState>(currentFilters);
  const [pendingReset, setPendingReset] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getCategoriesWithCountQuery } = useCategories();
  const overview = useInventoryOverview();
  const reduceMotion = usePrefersReducedMotion();

  const categories = getCategoriesWithCountQuery.data ?? [];
  const alertCounts = overview.counts;

  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;
    if (!visible || wasVisible) return;

    setTempFilters({
      status: currentFilters.status,
      category: currentFilters.category,
      alertList:
        currentFilters.alertList ??
        (currentFilters.alert ? [currentFilters.alert] : []),
    });
    setPendingReset(false);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, [visible, currentFilters]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const handleApply = () => {
    const alerts = tempFilters.alertList ?? [];
    onApplyFilters({
      status: tempFilters.status,
      category: tempFilters.category,
      alert: alerts[0],
      alertList: alerts,
    });
    AccessibilityInfo.announceForAccessibility(
      alerts.length
        ? `Filters applied, ${alerts.length} alert${alerts.length === 1 ? '' : 's'} active`
        : 'Filters applied',
    );
    onClose();
  };

  const handleResetTap = () => {
    if (!pendingReset) {
      setPendingReset(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => {},
      );
      resetTimerRef.current = setTimeout(() => {
        setPendingReset(false);
        resetTimerRef.current = null;
      }, RESET_ARM_MS);
      return;
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setPendingReset(false);
    const reset: ProductFiltersState = {
      status: 'all',
      alertList: [],
      category: undefined,
    };
    setTempFilters(reset);
    onApplyFilters(reset);
    AccessibilityInfo.announceForAccessibility('All filters cleared');
    onClose();
  };

  const getAlertCount = (kind: AlertKind): number => {
    switch (kind) {
      case 'low':
        return alertCounts?.low ?? 0;
      case 'out':
        return alertCounts?.out ?? 0;
      case 'near_expiry':
        return alertCounts?.nearExpiry ?? 0;
      case 'overstock':
        return alertCounts?.overstock ?? 0;
    }
  };

  const toggleAlert = (kind: AlertKind) => {
    setTempFilters((prev) => {
      const current = prev.alertList ?? [];
      const next = current.includes(kind)
        ? current.filter((k) => k !== kind)
        : [...current, kind];
      return { ...prev, alertList: next };
    });
  };

  const summaryChips = useMemo(() => {
    const chips: { label: string; key: string }[] = [];
    if (tempFilters.status !== 'all') {
      const opt = STATUS_OPTIONS.find((o) => o.key === tempFilters.status);
      if (opt) chips.push({ label: opt.label, key: `status:${opt.key}` });
    }
    const alerts = tempFilters.alertList ?? [];
    for (const k of alerts) {
      const opt = ALERT_OPTIONS.find((o) => o.kind === k);
      if (opt) chips.push({ label: opt.label, key: `alert:${k}` });
    }
    if (tempFilters.category) {
      chips.push({
        label: tempFilters.category,
        key: `category:${tempFilters.category}`,
      });
    }
    return chips;
  }, [tempFilters]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close filter"
          accessibilityHint="Dismiss filter modal without applying changes"
        />

        <View
          className="w-full bg-paper-50 rounded-t-3xl overflow-hidden shadow-modal"
          accessibilityViewIsModal
          accessibilityLabel="Filter products"
          style={{ elevation: 10 }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-4 pb-4">
            <View className="flex-1">
              <StyledText
                variant="black"
                className="text-persimmon-600 text-2xl"
              >
                Filter Products
              </StyledText>
              <StyledText
                variant="medium"
                className="text-ink-400 text-xs mt-0.5"
              >
                Pick what you want to see
              </StyledText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close filter modal"
              className="w-11 h-11 justify-center items-center rounded-full bg-paper-100"
            >
              <FontAwesome name="times" size={16} color="#28231D" />
            </TouchableOpacity>
          </View>

          {/* Active-filter summary row */}
          {summaryChips.length > 0 ? (
            <View className="px-6 pb-3 flex-row flex-wrap items-center gap-1.5">
              <StyledText
                variant="extrabold"
                className="label-caps text-ink-400 mr-1"
              >
                Active
              </StyledText>
              {summaryChips.map((chip) => (
                <View
                  key={chip.key}
                  className="px-2 py-1 rounded-pill bg-paper-100 border border-ink-200"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-xs"
                  >
                    {chip.label}
                  </StyledText>
                </View>
              ))}
              <TouchableOpacity
                onPress={handleResetTap}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  pendingReset
                    ? 'Confirm clear all filters'
                    : 'Clear all filters'
                }
                accessibilityHint={
                  pendingReset
                    ? 'Tap again within 4 seconds to confirm'
                    : 'First tap arms, second tap confirms'
                }
                className={`ml-1 px-2 py-1 rounded-pill border ${
                  pendingReset
                    ? 'bg-semantic-danger border-semantic-danger'
                    : 'bg-paper-50 border-ink-200'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`label-caps text-[10px] ${
                    pendingReset ? 'text-paper-50' : 'text-ink-700'
                  }`}
                >
                  {pendingReset ? 'Tap again to confirm' : '× Reset'}
                </StyledText>
              </TouchableOpacity>
            </View>
          ) : null}

          <ScrollView
            className="max-h-[32rem]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Section 1: Stock Status — PRIMARY */}
            <View className="px-6 mb-5">
              <SectionHeader
                label="Stock Status"
                accent="persimmon-500"
                hint="Pick one"
              />
              <View
                className="flex-row flex-wrap gap-2"
                accessibilityRole="radiogroup"
                accessibilityLabel="Stock status"
              >
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = tempFilters.status === opt.key;
                  return (
                    <FilterPill
                      key={opt.key}
                      label={opt.label}
                      selected={isSelected}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          status: opt.key,
                        }))
                      }
                      size="lg"
                      tone="primary"
                      accessibilityHint="Selects one stock status at a time"
                    />
                  );
                })}
              </View>
            </View>

            {/* Section 2: Inventory Alerts — additive */}
            <View className="px-6 my-5">
              <SectionHeader
                label="Inventory Alerts"
                accent="amber-500"
                hint="Pick any"
              />
              <View
                className="flex-row flex-wrap gap-2"
                accessibilityRole="radiogroup"
                accessibilityLabel="Inventory alerts"
              >
                {ALERT_OPTIONS.map((alertOpt) => {
                  const isSelected =
                    tempFilters.alertList?.includes(alertOpt.kind) ?? false;
                  const count = getAlertCount(alertOpt.kind);
                  return (
                    <FilterPill
                      key={alertOpt.kind}
                      label={alertOpt.label}
                      selected={isSelected}
                      onPress={() => toggleAlert(alertOpt.kind)}
                      icon={alertOpt.icon}
                      iconColor={alertOpt.color}
                      count={count}
                      accessibilityLabel={`${alertOpt.label} alert, ${count} item${count === 1 ? '' : 's'}`}
                      accessibilityHint="Tapping again removes this alert"
                    />
                  );
                })}
              </View>
            </View>

            {/* Section 3: Category — BROWSE */}
            <View className="px-6 mt-5">
              <SectionHeader
                label="Category"
                accent="persimmon-400"
                hint="Pick one"
              />
              <View
                className="flex-row flex-wrap gap-2"
                accessibilityRole="radiogroup"
                accessibilityLabel="Category"
              >
                <FilterPill
                  label="All Categories"
                  selected={!tempFilters.category}
                  onPress={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      category: undefined,
                    }))
                  }
                  size="md"
                  tone="secondary"
                  accessibilityHint="Removes any category filter"
                />

                {categories.map((cat) => {
                  const isSelected =
                    tempFilters.category?.toLowerCase() ===
                    cat.name.toLowerCase();
                  return (
                    <FilterPill
                      key={cat.id}
                      label={cat.name}
                      selected={isSelected}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          category: isSelected ? undefined : cat.name,
                        }))
                      }
                      count={cat.product_count}
                      accessibilityLabel={`${cat.name} category, ${cat.product_count} item${cat.product_count === 1 ? '' : 's'}`}
                      accessibilityHint="Tapping again removes this category"
                    />
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    onOpenAddCategory();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add new category"
                  accessibilityHint="Opens the add-category modal"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  className="px-3.5 py-2.5 rounded-pill border border-dashed border-persimmon-400 bg-persimmon-50 flex-row items-center gap-1.5"
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
              className="absolute left-0 right-0 h-3 flex-row justify-between bg-paper-50"
              style={{ top: -6 }}
            >
              {PERFORATION_DOTS.map((i) => (
                <View
                  key={`mp-${i}`}
                  className="w-3 h-3 rounded-full bg-paper-200"
                />
              ))}
            </View>
          </View>
          <View className="h-3" />

          {/* Actions */}
          <View className="flex-row gap-3 px-6 pt-4 pb-6 bg-paper-100 border-t border-dashed border-ink-200">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleResetTap}
              accessibilityRole="button"
              accessibilityLabel={
                pendingReset
                  ? 'Confirm clear all filters'
                  : 'Reset all filters'
              }
              accessibilityHint={
                pendingReset
                  ? 'Tap again to confirm'
                  : 'First tap arms, second tap confirms'
              }
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              className={`flex-1 rounded-2xl py-3.5 items-center border ${
                pendingReset
                  ? 'bg-semantic-danger-50 border-semantic-danger'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-base ${
                  pendingReset ? 'text-semantic-danger' : 'text-ink-700'
                }`}
              >
                {pendingReset ? 'Tap again to confirm' : 'Reset'}
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              className="flex-1 bg-persimmon-500 rounded-2xl py-3.5 items-center shadow-persimmon-glow"
              style={{ elevation: 8 }}
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
