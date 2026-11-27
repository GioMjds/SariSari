import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { memo, useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type LayoutChangeEvent,
  Pressable,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type ProductDetailTab =
  'overview' | 'movements' | 'pricing' | 'supplier';

interface TabDefinition {
  key: ProductDetailTab;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS = [
  { key: 'overview', icon: 'cube-outline' },
  { key: 'movements', icon: 'time-outline' },
  { key: 'pricing', icon: 'pricetag-outline' },
  { key: 'supplier', icon: 'business-outline' },
] satisfies TabDefinition[];

interface ProductDetailsTabsProps {
  activeTab: ProductDetailTab;
  onChange: (next: ProductDetailTab) => void;
  counts?: Partial<Record<ProductDetailTab, number>>;
}

export const ProductDetailsTabs = memo(function ProductDetailsTabs({
  activeTab,
  onChange,
  counts,
}: ProductDetailsTabsProps) {
  const { t } = useTranslation('inventory');
  const reducedMotion = useReducedMotion();
  const [metrics, setMetrics] = useState<
    Partial<Record<ProductDetailTab, { x: number; width: number }>>
  >({});

  const layoutHandlersRef = useRef<
    Partial<Record<ProductDetailTab, (e: LayoutChangeEvent) => void>>
  >({});

  const getTabLayoutHandler = useCallback((key: ProductDetailTab) => {
    if (!layoutHandlersRef.current[key]) {
      layoutHandlersRef.current[key] = (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        setMetrics((prev) => ({ ...prev, [key]: { x, width } }));
      };
    }
    return layoutHandlersRef.current[key]!;
  }, []);

  const handlePress = useCallback(
    (key: ProductDetailTab, label: string) => {
      if (key === activeTab) return;
      onChange(key);
      AccessibilityInfo.announceForAccessibility(label);
    },
    [activeTab, onChange],
  );

  const active = metrics[activeTab];

  return (
    <View
      className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden"
      accessibilityRole="tablist"
    >
      <View className="flex-row p-1 relative">
        {/* Tabs share equal widths, so the pill only slides on translateX. */}
        {active && (
          <MotiView
            pointerEvents="none"
            animate={{ translateX: active.x }}
            transition={{ type: 'timing', duration: reducedMotion ? 0 : 200 }}
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 0,
              width: active.width,
            }}
          >
            <View className="flex-1 rounded-xl bg-cinnamon-500" />
          </MotiView>
        )}

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts?.[tab.key];
          const label = t(`details_tab_${tab.key}`);

          return (
            <Pressable
              key={tab.key}
              onLayout={getTabLayoutHandler(tab.key)}
              onPress={() => handlePress(tab.key, label)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={
                typeof count === 'number' && count > 0
                  ? `${t('details_tabA11y', { label })}, ${count}`
                  : t('details_tabA11y', { label })
              }
              className="flex-1 min-h-[52px] py-2 rounded-xl items-center justify-center"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={tab.icon}
                  size={16}
                  className={isActive ? 'text-paper-50' : 'text-ink-500'}
                />
                {typeof count === 'number' && count > 0 && (
                  <View
                    className={`ml-1 px-1.5 rounded-pill ${
                      isActive ? 'bg-paper-50/25' : 'bg-paper-200'
                    }`}
                  >
                    <StyledText
                      variant="extrabold"
                      className={`text-[11px] ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {count > 99 ? '99+' : count}
                    </StyledText>
                  </View>
                )}
              </View>
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                className={`mt-1 text-xs ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
                numberOfLines={1}
              >
                {label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
