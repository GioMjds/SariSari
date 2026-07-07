import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export type CreditDetailTab = 'credits' | 'payments' | 'history';

interface TabDefinition {
  key: CreditDetailTab;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
}

const TABS: TabDefinition[] = [
  { key: 'credits', label: 'Credits', icon: 'credit-card' },
  { key: 'payments', label: 'Payments', icon: 'money' },
  { key: 'history', label: 'History', icon: 'history' },
];

interface TabNavigationProps {
  activeTab: CreditDetailTab;
  onChange: (next: CreditDetailTab) => void;
  /** Optional per-tab counts shown as a small superscript dot. */
  counts?: Partial<Record<CreditDetailTab, number>>;
}

/**
 * TabNavigation — credits / payments / history segmented control.
 *
 * The active-tab pill's `translateX` and `width` are derived from the
 * active tab's measured layout (captured via `onLayout` per tab) and
 * updated synchronously when `activeTab` changes — no spring, no
 * wiggle. The pill snaps to its new tab on each render.
 */
export function TabNavigation({
  activeTab,
  onChange,
  counts,
}: TabNavigationProps) {
  // Per-tab measured x + width. Indexed by tab key.
  const [metrics, setMetrics] = useState<
    Partial<Record<CreditDetailTab, { x: number; width: number }>>
  >({});

  // Stable per-tab layout handlers — stored in a ref so each Pressable
  // always receives the same function reference across renders, preventing
  // the entire tab row from re-rendering when `activeTab` or `metrics` changes.
  const layoutHandlersRef = useRef<
    Partial<Record<CreditDetailTab, (e: LayoutChangeEvent) => void>>
  >({});

  const getTabLayoutHandler = useCallback(
    (key: CreditDetailTab) => {
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
        {/* Active tab pill — sits behind the labels via absolute,
            positioned from the active tab's measured metrics. */}
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
}
