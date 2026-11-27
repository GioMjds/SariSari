import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyledText } from '../elements';
import { MoneyText } from '../ui';

interface Props {
  cash: number;
  credit: number;
  total: number;
  transactions: number;
  avgTicket: number;
}

export function PaymentSplitStrip({
  cash,
  credit,
  total,
  transactions,
  avgTicket,
}: Props) {
  const { t } = useTranslation();
  const totalForSplit = cash + credit;
  const cashPct = totalForSplit > 0 ? (cash / totalForSplit) * 100 : 0;
  const creditPct = totalForSplit > 0 ? (credit / totalForSplit) * 100 : 0;

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2">
        <StyledText variant="extrabold" className="text-sm text-ink-900">
          {t('common:reports.trend.paymentMix')}
        </StyledText>
        <StyledText variant="medium" className="text-xs text-ink-500">
          {t('common:reports.trend.checkouts', { count: transactions })}
        </StyledText>
      </View>

      {/* Segmented bar */}
      <View className="flex-row h-2 rounded-full overflow-hidden border border-ink-200">
        <View
          className="h-full"
          style={{
            width: `${cashPct}%`,
            backgroundColor: '#4F7A24',
          }}
        />
        <View
          className="h-full"
          style={{
            width: `${creditPct}%`,
            backgroundColor: '#E85A1F',
          }}
        />
      </View>

      <View className="flex-row mt-2">
        <View className="flex-1 flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-sage-500 mr-1.5" />
          <StyledText variant="semibold" className="text-xs text-sage-700">
            {t('common:reports.trend.cash')} {Math.round(cashPct)}%
          </StyledText>
          <MoneyText
            value={cash}
            size="sm"
            variant="default"
            className="text-ink-900 ml-2 text-xs"
          />
        </View>
        <View className="flex-1 flex-row items-center justify-end">
          <View className="w-2 h-2 rounded-full bg-persimmon-500 mr-1.5" />
          <StyledText variant="semibold" className="text-xs text-persimmon-700">
            {t('common:reports.trend.credit')} {Math.round(creditPct)}%
          </StyledText>
          <MoneyText
            value={credit}
            size="sm"
            variant="default"
            className="text-ink-900 ml-2 text-xs"
          />
        </View>
      </View>

      {/* Footer stat row */}
      <View className="mt-4 flex-row items-stretch border-t border-dashed border-ink-200 pt-3">
        <View className="flex-1">
          <StyledText variant="medium" className="text-xs text-ink-500">
            {t('common:reports.trend.avgTicket')}
          </StyledText>
          <MoneyText
            value={avgTicket}
            size="sm"
            variant="default"
            className="text-ink-900 text-sm"
          />
        </View>
        <View className="flex-1">
          <StyledText variant="medium" className="text-xs text-ink-500">
            {t('common:reports.trend.sales')}
          </StyledText>
          <MoneyText
            value={total}
            size="sm"
            variant="default"
            className="text-ink-900 text-sm"
          />
        </View>
      </View>
    </View>
  );
}
