import React from 'react';
import { View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatCurrency } from '@/utils';

export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number;
  lowStockCount: number;
  totalCredits: number;
}

export function DashboardKPIGrid({
  totalSales,
  transactionCount,
  profitMargin,
  lowStockCount,
  totalCredits,
}: DashboardKPIGridProps) {
  const kpis = [
    {
      title: 'Total Sales Today',
      value: formatCurrency(totalSales),
      subtitle: `${transactionCount} sales`,
      icon: 'shopping-cart',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Est. Profit Margin',
      value: `${profitMargin}%`,
      subtitle: 'Target: >25%',
      icon: 'chart-line',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
    },
    {
      title: 'Low Stock Risk',
      value: `${lowStockCount} Items`,
      subtitle: lowStockCount > 0 ? 'Needs restock' : 'Stock level healthy',
      icon: 'exclamation-triangle',
      color: lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600',
      bgColor: lowStockCount > 0 ? 'bg-amber-50' : 'bg-emerald-50',
    },
    {
      title: 'Total Credits Due',
      value: formatCurrency(totalCredits),
      subtitle: 'Customer Utang',
      icon: 'user-clock',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <View className="flex-row flex-wrap gap-3 px-4 mb-4">
      {kpis.map((kpi, index) => (
        <View
          key={index}
          className="w-[48%] bg-paper-50 p-3.5 rounded-2xl border border-ink-100 shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-2">
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {kpi.title}
            </StyledText>
            <View
              className={`w-7 h-7 rounded-full ${kpi.bgColor} items-center justify-center`}
            >
              <FontAwesome5
                name={kpi.icon as any}
                size={12}
                className={kpi.color}
              />
            </View>
          </View>
          <StyledText variant="extrabold" className="text-ink-900 text-lg">
            {kpi.value}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-400 text-[11px] mt-0.5"
          >
            {kpi.subtitle}
          </StyledText>
        </View>
      ))}
    </View>
  );
}
