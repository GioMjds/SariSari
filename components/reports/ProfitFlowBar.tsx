import { StyledText } from '@/components/elements';
import { formatCompactCurrency } from '@/utils';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { profitFlowShares } from './report-math';

type Props = {
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
};

const SEGMENTS = [
  { key: 'cost', color: '#623418', dot: 'bg-cinnamon-500' },
  { key: 'expenses', color: '#E85A1F', dot: 'bg-persimmon-500' },
  { key: 'profit', color: '#4F7A24', dot: 'bg-sage-500' },
] as const;

/** One bar that shows how revenue split into product cost, gastos, and kita. */
export function ProfitFlowBar({ revenue, cost, expenses, profit }: Props) {
  const { t } = useTranslation();
  const shares = profitFlowShares(revenue, cost, expenses);
  const amounts = { cost, expenses, profit };

  return (
    <View
      accessible
      accessibilityLabel={t('common:reports.flow.a11y', {
        revenue: formatCompactCurrency(revenue),
        cost: formatCompactCurrency(cost),
        expenses: formatCompactCurrency(expenses),
        profit: formatCompactCurrency(profit),
      })}
    >
      <View className="flex-row items-baseline justify-between mb-2">
        <StyledText variant="extrabold" className="text-sm text-ink-900">
          {t('common:reports.flow.title')}
        </StyledText>
        <StyledText variant="semibold" className="text-xs text-ink-500">
          {t('common:reports.flow.revenue')} {formatCompactCurrency(revenue)}
        </StyledText>
      </View>

      <View className="flex-row h-3 rounded-full overflow-hidden bg-ink-100">
        {SEGMENTS.map((s) =>
          shares[s.key] > 0 ? (
            <View
              key={s.key}
              style={{ flex: shares[s.key], backgroundColor: s.color }}
            />
          ) : null,
        )}
      </View>

      <View className="mt-3 gap-y-1.5">
        {SEGMENTS.map((s) => (
          <View key={s.key} className="flex-row items-center">
            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${s.dot}`} />
            <StyledText variant="medium" className="text-sm text-ink-700 flex-1">
              {t(`common:reports.flow.${s.key}`)}
            </StyledText>
            <StyledText variant="semibold" className="text-xs text-ink-500 mr-3">
              {Math.round(shares[s.key] * 100)}%
            </StyledText>
            <StyledText
              variant="extrabold"
              className={`text-sm ${
                s.key === 'profit' && profit < 0
                  ? 'text-semantic-danger'
                  : 'text-ink-900'
              }`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatCompactCurrency(amounts[s.key])}
            </StyledText>
          </View>
        ))}
      </View>
    </View>
  );
}
