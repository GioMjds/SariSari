import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatCurrency } from '@/utils';

export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number | null;
  cashSessionStatus?: 'Open' | 'Closed';
  startingFloat?: number;
  lowStockCount: number;
  totalCredits: number;
  creditCustomersCount?: number;
  onDetailsPress?: () => void;
  onKpiPress?: (target: 'reports' | 'cash' | 'inventory' | 'customers') => void;
}

type KPIItem = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  topBorder: string;
  target: 'reports' | 'cash' | 'inventory' | 'customers';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DashboardKPIGrid({
  profitMargin,
  cashSessionStatus = 'Open',
  startingFloat = 500,
  lowStockCount,
  totalCredits,
  creditCustomersCount = 3,
  onDetailsPress,
  onKpiPress,
}: DashboardKPIGridProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const kpis = [
    {
      title: 'EST. PROFIT',
      value: profitMargin === null ? '-' : formatCurrency(profitMargin),
      subtitle: 'Net income',
      icon: 'chart-line',
      topBorder: 'border-t-[3px] border-cinnamon-500',
      target: 'reports',
    },
    {
      title: 'CASH SESSION',
      value: cashSessionStatus,
      subtitle: `${formatCurrency(startingFloat)}`,
      icon: 'wallet',
      topBorder: 'border-t-[3px] border-sage-600',
      target: 'cash',
    },
    {
      title: 'LOW STOCK',
      value: `${lowStockCount} items`,
      subtitle: lowStockCount > 0 ? 'Needs restock' : 'Stock healthy',
      icon: 'box-open',
      topBorder: 'border-t-[3px] border-amber-500',
      target: 'inventory',
    },
    {
      title: 'CREDITS DUE',
      value: formatCurrency(totalCredits),
      subtitle: `${creditCustomersCount} customers`,
      icon: 'user-clock',
      topBorder: 'border-t-[3px] border-rose-600',
      target: 'customers',
    },
  ] satisfies KPIItem[];

  return (
    <View className="mb-6">
      {/* 2x2 KPI Cards Grid */}
      <View className="flex-row flex-wrap gap-3 px-4">
        {kpis.map((kpi, index) => {
          return (
            <AnimatedPressable
              key={index}
              style={animatedStyle}
              accessibilityRole="button"
              accessibilityLabel={`${kpi.title}, ${kpi.value}, ${kpi.subtitle}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => {},
                );
                if (onKpiPress) {
                  onKpiPress(kpi.target);
                } else {
                  onDetailsPress?.();
                }
              }}
              className={`w-[48%] bg-paper-50 p-3 rounded-2xl border border-ink-100 shadow-sm min-h-[92px] ${kpi.topBorder}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <StyledText
                  variant="extrabold"
                  className="text-ink-400 text-[11px] tracking-wider uppercase"
                >
                  {kpi.title}
                </StyledText>
              </View>
              <StyledText variant="extrabold" className="text-ink-900 text-xl">
                {kpi.value}
              </StyledText>
              <View className="flex-row items-center justify-between mt-1.5">
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-[11px]"
                >
                  {kpi.subtitle}
                </StyledText>
                <FontAwesome5
                  name={kpi.icon}
                  size={11}
                  color="#A89F90"
                />
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
