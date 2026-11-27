import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReportKPIs } from '@/types/reports.types';
import { formatPesos } from '@/lib/money';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';

interface Props {
  kpis: ReportKPIs;
  onOpenLedger: () => void;
}

function Row({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-dashed border-ink-200">
      <View className="flex-1 mr-3">
        <StyledText variant="medium" className="text-sm text-ink-700">
          {label}
        </StyledText>
        {note && (
          <StyledText variant="regular" className="text-xs text-ink-500">
            {note}
          </StyledText>
        )}
      </View>
      {children}
    </View>
  );
}

export const FinancialResultSection: React.FC<Props> = ({
  kpis,
  onOpenLedger,
}) => {
  const { t } = useTranslation();
  const r = (key: string) => t(`common:reports.result.${key}`);

  return (
    <View className="bg-paper-50 rounded-xl p-4 border border-ink-200 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <StyledText variant="extrabold" className="text-base text-ink-900 flex-1 mr-2">
          {r('title')}
        </StyledText>
        <Pressable
          onPress={onOpenLedger}
          accessibilityRole="button"
          accessibilityLabel={r('actionA11y')}
          hitSlop={8}
          className="flex-row items-center px-3 py-2 bg-cinnamon-500 rounded-full active:bg-cinnamon-600"
        >
          <StyledText variant="semibold" className="text-xs text-paper-50 mr-1.5">
            {r('action')}
          </StyledText>
          <FontAwesome5 name="arrow-right" size={10} color="#FBF7EE" />
        </Pressable>
      </View>

      {kpis.operatingProfit === null && (
        <View className="bg-cinnamon-50/60 p-3 rounded-lg mb-3 border border-dashed border-cinnamon-300 flex-row items-center gap-2.5">
          <FontAwesome5 name="info-circle" size={13} color="#623418" />
          <StyledText variant="medium" className="text-xs text-cinnamon-700 flex-1 leading-4">
            {r('missingCost')}
          </StyledText>
        </View>
      )}

      <Row label={r('cashSales')}>
        <MoneyText value={kpis.totalSales} size="sm" variant="default" className="text-ink-900" />
      </Row>
      <Row label={r('utangSales')} note={r('utangNote')}>
        <MoneyText value={kpis.utangSales} size="sm" variant="default" className="text-ink-900" />
      </Row>
      <Row label={r('cogs')}>
        <StyledText variant="semibold" className="text-sm text-ink-900">
          -{formatPesos(kpis.inventoryCostOut)}
        </StyledText>
      </Row>

      <View className="flex-row justify-between items-center py-2 px-2.5 bg-sage-50 rounded-lg my-1 border border-sage-200">
        <StyledText variant="extrabold" className="text-sm text-sage-700">
          {r('gross')}
        </StyledText>
        {kpis.grossProfit === null ? (
          <StyledText variant="semibold" className="text-sm text-ink-500">—</StyledText>
        ) : (
          <MoneyText value={kpis.grossProfit} size="sm" variant="success" />
        )}
      </View>

      <Row label={r('expenses')}>
        <StyledText variant="semibold" className="text-sm text-semantic-danger">
          -{formatPesos(kpis.paidExpenses)}
        </StyledText>
      </Row>

      <View className="flex-row justify-between items-center py-3 px-3 bg-sage-100 rounded-xl my-2 border border-sage-300">
        <View className="flex-1 mr-3">
          <StyledText variant="extrabold" className="text-sm text-sage-700">
            {r('net')}
          </StyledText>
          <StyledText variant="medium" className="text-xs text-sage-700">
            {r('netNote')}
          </StyledText>
        </View>
        {kpis.operatingProfit === null ? (
          <StyledText variant="extrabold" className="text-base text-ink-500">—</StyledText>
        ) : (
          <MoneyText
            value={kpis.operatingProfit}
            size="lg"
            variant={kpis.operatingProfit < 0 ? 'danger' : 'success'}
          />
        )}
      </View>

      <View className="flex-row justify-between items-center pt-2.5 mt-1 border-t border-dashed border-ink-200">
        <View className="flex-1 mr-3">
          <StyledText variant="semibold" className="text-sm text-cinnamon-700">
            {r('drawings')}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-500">
            {r('drawingsNote')}
          </StyledText>
        </View>
        <MoneyText value={kpis.ownerDrawings} size="sm" variant="default" className="text-cinnamon-700" />
      </View>
    </View>
  );
};
