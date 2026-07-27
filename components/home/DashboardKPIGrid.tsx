import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatCurrency } from '@/utils';

export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number;
  cashSessionStatus?: 'Open' | 'Closed';
  startingFloat?: number;
  lowStockCount: number;
  totalCredits: number;
  creditCustomersCount?: number;
  onDetailsPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DashboardKPIGrid({
  totalSales,
  transactionCount,
  profitMargin,
  cashSessionStatus = 'Open',
  startingFloat = 500,
  lowStockCount,
  totalCredits,
  creditCustomersCount = 3,
  onDetailsPress,
}: DashboardKPIGridProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Replace with original data (to be remove)
  const kpis = [
    {
      title: 'MARGIN',
      value: formatCurrency(profitMargin),
      subtitle: '+25.7% today',
      icon: 'arrow-up',
      topBorder: 'border-t-4 border-cinnamon-500',
    },
    {
      title: 'CASH SESSION',
      value: cashSessionStatus,
      subtitle: `Float ${formatCurrency(startingFloat)}`,
      icon: 'wallet',
      topBorder: 'border-t-4 border-sage-600',
    },
    {
      title: 'LOW STOCK',
      value: `${lowStockCount} items`,
      subtitle: 'Needs restock',
      icon: 'box-open',
      topBorder: 'border-t-4 border-amber-500',
    },
    {
      title: 'CREDITS DUE',
      value: formatCurrency(totalCredits),
      subtitle: `${creditCustomersCount} customers`,
      icon: 'user-clock',
      topBorder: 'border-t-4 border-rose-600',
    },
  ];

  return (
    <View className="mb-4">
      {/* Hero Total Sales Block */}
      <View className="px-4 mb-4">
        <StyledText
          variant="extrabold"
          className="text-ink-500 text-xs tracking-wider uppercase"
        >
          TOTAL SALES TODAY
        </StyledText>
        <View className="flex-row items-baseline gap-3 mt-1">
          <StyledText variant="extrabold" className="text-ink-900 text-4xl">
            {formatCurrency(totalSales)}
          </StyledText>
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <StyledText variant="regular" className="text-ink-500 text-xs">
            {transactionCount} transactions
          </StyledText>
          <View className="bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
            <StyledText
              variant="extrabold"
              className="text-emerald-700 text-[11px]"
            >
              +12% vs yesterday
            </StyledText>
          </View>
        </View>
      </View>

      {/* KPIS Section Header */}
      <View className="px-4 flex-row items-center justify-between mb-2">
        <StyledText
          variant="extrabold"
          className="text-ink-500 text-xs tracking-wider uppercase"
        >
          KPIS
        </StyledText>
        <Pressable onPress={onDetailsPress} hitSlop={8}>
          <StyledText variant="extrabold" className="text-cinnamon-600 text-xs">
            Details &gt;
          </StyledText>
        </Pressable>
      </View>

      {/* 2x2 KPI Cards Grid with Reanimated Press Feedback */}
      <View className="flex-row flex-wrap gap-3 px-4">
        {kpis.map((kpi, index) => {
          return (
            <AnimatedPressable
              key={index}
              style={animatedStyle}
              onPressIn={() => {
                scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
              }}
              onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 300 });
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => {},
                );
                onDetailsPress?.();
              }}
              className={`w-[48%] bg-paper-50 p-3.5 rounded-2xl border border-ink-100 shadow-sm ${kpi.topBorder}`}
            >
              <View className="flex-row items-center justify-between mb-1">
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
              <View className="flex-row items-center justify-between mt-1">
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-[11px]"
                >
                  {kpi.subtitle}
                </StyledText>
                <FontAwesome5
                  name={kpi.icon as any}
                  size={11}
                  className="text-ink-400 opacity-60"
                />
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
