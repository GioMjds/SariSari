import { memo, useCallback, useMemo } from 'react';
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
  // NOTE: `totalSales` and `transactionCount` were declared but never rendered.
  // Removed so the grid doesn't re-render on every sale.
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
      className="w-[48%] bg-paper-50 p-3 rounded-2xl border border-ink-100 shadow-sm min-h-[92px]"
    >
      <View className="flex-row items-center justify-between mb-2">
        <StyledText variant="extrabold" className="text-ink-600 text-xs">
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

export const DashboardKPIGrid = memo(function DashboardKPIGrid({
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
      if (onKpiPress) onKpiPress(target);
      else onDetailsPress?.();
    },
    [onKpiPress, onDetailsPress],
  );

  // Memoize each KPI independently so a change to one only re-renders its card.
  const profitKpi = useMemo<KPIItem>(
    () => ({
      title: 'Profit today',
      value: profitMargin === null ? '-' : formatCurrency(profitMargin),
      subtitle: 'Includes utang',
      icon: 'chart-line',
      target: 'reports',
    }),
    [profitMargin],
  );

  const expensesKpi = useMemo<KPIItem>(
    () => ({
      title: 'Expenses today',
      value: formatCurrency(expensesToday),
      subtitle:
        drawingsToday > 0
          ? `Taken out ${formatCurrency(drawingsToday)}`
          : 'Gastos recorded',
      icon: 'wallet',
      target: 'cash',
    }),
    [expensesToday, drawingsToday],
  );

  const lowStockKpi = useMemo<KPIItem>(
    () => ({
      title: 'Low stock',
      value: `${lowStockCount} items`,
      subtitle: lowStockCount > 0 ? 'Needs restock' : 'Stock healthy',
      icon: 'box-open',
      target: 'inventory',
    }),
    [lowStockCount],
  );

  const overdueKpi = useMemo<KPIItem>(
    () => ({
      title: 'Overdue utang',
      value: formatCurrency(totalCredits),
      subtitle: `${creditCustomersCount} ${
        creditCustomersCount === 1 ? 'suki' : 'sukis'
      }`,
      icon: 'user-clock',
      target: 'customers',
    }),
    [totalCredits, creditCustomersCount],
  );

  const kpis = useMemo(
    () => [profitKpi, expensesKpi, lowStockKpi, overdueKpi],
    [profitKpi, expensesKpi, lowStockKpi, overdueKpi],
  );

  return (
    <View className="mb-6">
      <View className="flex-row flex-wrap gap-3 px-4">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.target}
            kpi={kpi}
            animatedStyle={animatedStyle}
            onPress={handleKpiPress}
          />
        ))}
      </View>
    </View>
  );
});
