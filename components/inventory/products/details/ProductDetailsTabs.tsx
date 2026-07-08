import { FontAwesome } from '@expo/vector-icons';
import { memo, useCallback, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  View,
} from 'react-native';
import { StyledText } from '@/components/elements';

export type ProductDetailTab = 'overview' | 'history' | 'supplier';

interface TabDefinition {
  key: ProductDetailTab;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
}

const TABS: TabDefinition[] = [
  { key: 'overview', label: 'Overview', icon: 'cube' },
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'supplier', label: 'Supplier', icon: 'truck' },
];

interface ProductDetailsTabsProps {
  activeTab: ProductDetailTab;
  onChange: (next: ProductDetailTab) => void;
  /** Optional per-tab counts surfaced as a small superscript badge. */
  counts?: Partial<Record<ProductDetailTab, number>>;
}

/**
 * ProductDetailsTabs — three-segment control for the product-details
 * screen (Overview / History / Supplier).
 *
 * Mirrors the `TabNavigation` pattern from credit-details: a paper-50
 * card hosts a row of Pressables, with a cinnamon active-pill that
 * snaps to the selected tab's measured position. No spring, no
 * wiggle — the pill tracks the active tab on every render.
 */
export const ProductDetailsTabs = memo(function ProductDetailsTabs({
  activeTab,
  onChange,
  counts,
}: ProductDetailsTabsProps) {
  const [metrics, setMetrics] = useState<
    Partial<Record<ProductDetailTab, { x: number; width: number }>>
  >({});

  // Per-tab layout handlers stored in a ref so each Pressable always
  // receives the same function reference across renders — prevents the
  // entire tab row from re-rendering when `activeTab` or `metrics`
  // changes.
  const layoutHandlersRef = useRef<
    Partial<Record<ProductDetailTab, (e: LayoutChangeEvent) => void>>
  >({});

  const getTabLayoutHandler = useCallback(
    (key: ProductDetailTab) => {
      if (!layoutHandlersRef.current[key]) {
        layoutHandlersRef.current[key] = (e: LayoutChangeEvent) => {
          const { x, width } = e.nativeEvent.layout;
          setMetrics((prev) => ({ ...prev, [key]: { x, width } }));
        };
      }
      return layoutHandlersRef.current[key]!;
    },
    [],
  );

  const active = metrics[activeTab];

  return (
    <View
      className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper overflow-hidden"
      accessibilityRole="tablist"
    >
      <View className="flex-row p-1 relative">
        {/* Active-tab pill — sits behind the labels, positioned from
            the active tab's measured metrics. */}
        <View
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 0,
            borderRadius: 14,
            backgroundColor: '#623418', // cinnamon-500
            transform: [{ translateX: active?.x ?? 0 }],
            width: active?.width ?? 0,
          }}
          pointerEvents="none"
        />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts?.[tab.key];

          return (
            <Pressable
              key={tab.key}
              onLayout={getTabLayoutHandler(tab.key)}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              className="flex-1 py-2.5 rounded-xl press-scale"
            >
              <View className="flex-row items-center justify-center">
                <FontAwesome
                  name={tab.icon}
                  size={12}
                  color={isActive ? '#FBF7EE' : '#7A7165'}
                />
                <StyledText
                  variant={isActive ? 'extrabold' : 'semibold'}
                  className={`ml-1.5 ${
                    isActive ? 'text-paper-50' : 'text-ink-700'
                  }`}
                  style={{ fontSize: 13 }}
                >
                  {tab.label}
                </StyledText>
                {typeof count === 'number' && count > 0 && (
                  <View
                    className={`ml-1.5 px-1.5 py-0.5 rounded-pill ${
                      isActive ? 'bg-paper-50/20' : 'bg-paper-200'
                    }`}
                  >
                    <StyledText
                      variant="extrabold"
                      className={`text-[10px] ${
                        isActive ? 'text-paper-50' : 'text-ink-700'
                      }`}
                    >
                      {count}
                    </StyledText>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
