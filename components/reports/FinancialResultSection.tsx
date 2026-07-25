import React from 'react';
import { View, Pressable } from 'react-native';
import { ReportKPIs } from '@/types/reports.types';
import { formatPesos } from '@/lib/money';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';

interface Props {
  kpis: ReportKPIs;
  onOpenLedger: () => void;
}

export const FinancialResultSection: React.FC<Props> = ({
  kpis,
  onOpenLedger,
}) => {
  return (
    <View className="bg-paper-50 rounded-xl p-4 mb-4 border border-ink-200 shadow-sm">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <StyledText variant="extrabold" className="text-base text-ink-900">
          Financial Result
        </StyledText>
        <Pressable
          onPress={onOpenLedger}
          accessibilityRole="button"
          accessibilityLabel="Open Gastos and Kaha Ledger"
          className="flex-row items-center px-3 py-1.5 bg-cinnamon-500 rounded-full active:bg-cinnamon-600 shadow-sm"
        >
          <StyledText variant="semibold" className="text-xs text-paper-50 mr-1.5">
            Gastos & Kaha Ledger
          </StyledText>
          <FontAwesome5 name="arrow-right" size={10} color="#FBF7EE" />
        </Pressable>
      </View>

      {/* Warning Banner when Cost Prices are Missing */}
      {kpis.operatingProfit === null && (
        <View className="bg-cinnamon-50/60 p-3 rounded-lg mb-3 border border-dashed border-cinnamon-300 flex-row items-center gap-2.5">
          <FontAwesome5 name="info-circle" size={13} color="#623418" />
          <StyledText variant="medium" className="text-xs text-cinnamon-800 flex-1 leading-4">
            Record cost prices for all sold items to calculate gross and true operating profit.
          </StyledText>
        </View>
      )}

      {/* Tally Breakdown Rows */}
      <View className="space-y-1">
        {/* Total Sales */}
        <View className="flex-row justify-between items-center py-2 border-b border-dashed border-ink-200">
          <StyledText variant="medium" className="text-xs text-ink-600">
            Total Sales
          </StyledText>
          <MoneyText value={kpis.totalSales} size="sm" variant="default" className="text-ink-900" />
        </View>

        {/* Cost of Goods Sold */}
        <View className="flex-row justify-between items-center py-2 border-b border-dashed border-ink-200">
          <StyledText variant="medium" className="text-xs text-ink-600">
            Cost of Goods Sold (COGS)
          </StyledText>
          <StyledText variant="semibold" className="text-xs text-ink-900">
            -{formatPesos(kpis.inventoryCostOut)}
          </StyledText>
        </View>

        {/* Gross Profit (Tubo Subtotal) */}
        <View className="flex-row justify-between items-center py-2 px-2.5 bg-sage-50/60 rounded-lg my-1 border border-sage-200/50">
          <StyledText variant="extrabold" className="text-xs text-sage-800">
            Gross Profit (Tubo)
          </StyledText>
          <MoneyText
            value={kpis.grossProfit ?? 0}
            size="sm"
            variant="success"
          />
        </View>

        {/* Paid Operating Gastos */}
        <View className="flex-row justify-between items-center py-2 border-b border-dashed border-ink-200">
          <StyledText variant="medium" className="text-xs text-ink-600">
            Paid Operating Gastos
          </StyledText>
          <StyledText variant="semibold" className="text-xs text-semantic-danger">
            -{formatPesos(kpis.paidExpenses)}
          </StyledText>
        </View>

        {/* True Operating Profit (Hero Bottom-line) */}
        <View className="flex-row justify-between items-center py-3 px-3 bg-sage-100/90 rounded-xl my-2 border border-sage-300 shadow-sm">
          <View>
            <StyledText variant="extrabold" className="text-sm text-sage-900">
              True Operating Profit
            </StyledText>
            <StyledText variant="medium" className="text-[10px] text-sage-700">
              Net store profit after operating expenses
            </StyledText>
          </View>
          <MoneyText
            value={kpis.operatingProfit ?? 0}
            size="lg"
            variant="success"
          />
        </View>

        {/* Owner Drawings Audit Line */}
        <View className="flex-row justify-between items-center py-2 pt-2.5 mt-1 border-t border-dashed border-ink-200">
          <View>
            <StyledText variant="semibold" className="text-xs text-cinnamon-800">
              Owner Drawings (Kaha Take-out)
            </StyledText>
            <StyledText variant="regular" className="text-[10px] text-ink-400">
              Excluded from operating profit
            </StyledText>
          </View>
          <MoneyText
            value={kpis.ownerDrawings}
            size="sm"
            variant="default"
            className="text-cinnamon-700"
          />
        </View>
      </View>
    </View>
  );
};

