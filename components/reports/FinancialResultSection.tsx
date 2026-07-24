import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ReportKPIs } from '@/types/reports.types';
import { formatPesos } from '@/lib/money';
import { FontAwesome5 } from '@expo/vector-icons';

interface Props {
  kpis: ReportKPIs;
  onOpenLedger: () => void;
}

export const FinancialResultSection: React.FC<Props> = ({
  kpis,
  onOpenLedger,
}) => {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-900 dark:text-white">
          Financial Result
        </Text>
        <Pressable
          onPress={onOpenLedger}
          className="flex-row items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-full border border-emerald-200 dark:border-emerald-800"
        >
          <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mr-1">
            Gastos & Kaha Ledger
          </Text>
          <FontAwesome5 name="arrow-right" size={10} color="#047857" />
        </Pressable>
      </View>

      {kpis.operatingProfit === null ? (
        <View className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl mb-3 border border-amber-200 dark:border-amber-800">
          <Text className="text-xs text-amber-800 dark:text-amber-300">
            Record cost prices for all sold items to calculate gross and true
            operating profit.
          </Text>
        </View>
      ) : null}

      <View className="space-y-2">
        <View className="flex-row justify-between py-1 border-b border-gray-100 dark:border-gray-700">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Total Sales
          </Text>
          <Text className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatPesos(kpis.totalSales)}
          </Text>
        </View>

        <View className="flex-row justify-between py-1 border-b border-gray-100 dark:border-gray-700">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Cost of Goods Sold (COGS)
          </Text>
          <Text className="text-sm font-semibold text-gray-900 dark:text-white">
            -{formatPesos(kpis.inventoryCostOut)}
          </Text>
        </View>

        <View className="flex-row justify-between py-1 border-b border-gray-100 dark:border-gray-700">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Gross Profit
          </Text>
          <Text className="text-sm font-semibold text-gray-900 dark:text-white">
            {kpis.grossProfit !== null ? formatPesos(kpis.grossProfit) : '—'}
          </Text>
        </View>

        <View className="flex-row justify-between py-1 border-b border-gray-100 dark:border-gray-700">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Paid Operating Gastos
          </Text>
          <Text className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            -{formatPesos(kpis.paidExpenses)}
          </Text>
        </View>

        <View className="flex-row justify-between py-2 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 rounded-lg">
          <Text className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            True Operating Profit
          </Text>
          <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {kpis.operatingProfit !== null
              ? formatPesos(kpis.operatingProfit)
              : '—'}
          </Text>
        </View>

        <View className="flex-row justify-between py-1.5 mt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
          <View>
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Owner Drawings (Kaha)
            </Text>
            <Text className="text-[10px] text-gray-400 dark:text-gray-500">
              Excluded from operating profit
            </Text>
          </View>
          <Text className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {formatPesos(kpis.ownerDrawings)}
          </Text>
        </View>
      </View>
    </View>
  );
};
