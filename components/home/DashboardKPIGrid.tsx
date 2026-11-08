import React, { memo, useCallback } from 'react';
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
  expensesToday?: number;
  drawingsToday?: number;
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
  target: 'reports' | 'cash' | 'inventory' | 'customers';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface KPICardProps {
  kpi: KPIItem;
  animatedStyle: any;
  onPress: (target: KPIItem['target']) => void;
}

const KPICard = memo(function KPICard({
  kpi,
  animatedStyle,
  onPress,
}: KPICardProps) {
  const handlePress = useCallback(() => {
    onPress(kpi.target);
  }, [kpi.target, onPress]);

  return (
    <AnimatedPressable
      style={animatedStyle}
      accessibilityRole="button"
      accessibilityLabel={`${kpi.title}, ${kpi.value}, ${kpi.subtitle}`}
      onPress={handlePress}
      className={`w-[48%] bg-paper-50 p-3 rounded-2xl border border-ink-100 shadow-sm min-h-[92px]`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <StyledText
          variant="extrabold"
          className="text-ink-600 text-xs"
        >
          {kpi.title}
        </StyledText>
      </View>
      <StyledText variant="extrabold" className="text-ink-900 text-xl">
        {kpi.value}
      </StyledText>
      <View className="flex-row items-center justify-between mt-1.5">
        <StyledText variant="regular" className="text-ink-600 text-xs">
          {kpi.subtitle}
        </StyledText>
        <FontAwesome5 name={kpi.icon} size={12} color="#7A7165" />
      </View>
    </AnimatedPressable>
  );
});

export function DashboardKPIGrid({
  profitMargin,
  expensesToday = 0,
  drawingsToday = 0,
  lowStockCount,
  totalCredits,
  creditCustomersCount = 0,
  onDetailsPress,
  onKpiPress,
}: DashboardKPIGridProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleKpiPress = useCallback(
    (target: KPIItem['target']) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (onKpiPress) {
        onKpiPress(target);
      } else {
        onDetailsPress?.();
      }
    },
    [onKpiPress, onDetailsPress],
  );

  const kpis = [
    {
      title: 'Profit today',
      value: profitMargin === null ? '-' : formatCurrency(profitMargin),
      subtitle: 'Before expenses',
      icon: 'chart-line',
      target: 'reports',
    },
    {
      title: 'Expenses today',
      value: formatCurrency(expensesToday),
      subtitle:
        drawingsToday > 0
          ? `Taken out ${formatCurrency(drawingsToday)}`
          : 'Gastos recorded',
      icon: 'wallet',
      target: 'cash',
    },
    {
      title: 'Low stock',
      value: `${lowStockCount} items`,
      subtitle: lowStockCount > 0 ? 'Needs restock' : 'Stock healthy',
      icon: 'box-open',
      target: 'inventory',
    },
    {
      title: 'Overdue utang',
      value: formatCurrency(totalCredits),
      subtitle: `${creditCustomersCount} ${creditCustomersCount === 1 ? 'suki' : 'sukis'}`,
      icon: 'user-clock',
      target: 'customers',
    },
  ] satisfies KPIItem[];

  return (
    <View className="mb-6">
      {/* 2x2 KPI Cards Grid */}
      <View className="flex-row flex-wrap gap-3 px-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            kpi={kpi}
            animatedStyle={animatedStyle}
            onPress={handleKpiPress}
          />
        ))}
      </View>
    </View>
  );
}
