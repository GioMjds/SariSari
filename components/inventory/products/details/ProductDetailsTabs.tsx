import { FontAwesome } from '@expo/vector-icons';
import { memo, useCallback, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

export type ProductDetailTab = 'overview' | 'movements' | 'pricing' | 'supplier';

interface TabDefinition {
  key: ProductDetailTab;
  icon: keyof typeof FontAwesome.glyphMap;
}

const TABS = [
  { key: 'overview', icon: 'cube' },
  { key: 'movements', icon: 'history' },
  { key: 'pricing', icon: 'tag' },
  { key: 'supplier', icon: 'truck' },
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

  const active = metrics[activeTab];

  return (
    <View
      className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden"
      accessibilityRole="tablist"
    >
      <View className="flex-row p-1 relative">
        {/* Active pill sits behind the labels, placed from the measured tab. */}
        <View
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 0,
            borderRadius: 12,
            backgroundColor: '#623418',
            transform: [{ translateX: active?.x ?? 0 }],
            width: active?.width ?? 0,
          }}
          pointerEvents="none"
        />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts?.[tab.key];
          const label = t(`details_tab_${tab.key}`);

          return (
            <Pressable
              key={tab.key}
              onLayout={getTabLayoutHandler(tab.key)}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t('details_tabA11y', { label })}
              className="flex-1 min-h-[52px] py-2 rounded-xl items-center justify-center"
            >
              <View className="flex-row items-center">
                <FontAwesome
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#FBF7EE' : '#7A7165'}
                />
                {typeof count === 'number' && count > 0 && (
                  <View
                    className={`ml-1 px-1.5 rounded-pill ${
                      isActive ? 'bg-paper-50/25' : 'bg-paper-200'
                    }`}
                  >
                    <StyledText
                      variant="extrabold"
                      className={`text-[10px] ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
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
