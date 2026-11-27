import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import { DashboardSection } from './DashboardSection';

export interface DashboardMoneyTodayProps {
  cashSales: number;
  collected: number;
  expenses: number;
  drawings: number;
  onOpenCashEntries: () => void;
}

// Receipt-style cash flow for the day; utang given is left out because no cash moved.
export const DashboardMoneyToday = memo(function DashboardMoneyToday({
  cashSales,
  collected,
  expenses,
  drawings,
  onOpenCashEntries,
}: DashboardMoneyTodayProps) {
  const { t } = useTranslation('common');
  const net = cashSales + collected - expenses - drawings;

  return (
    <DashboardSection
      testID="home-money"
      title={t('dashboard.money.title', { defaultValue: 'Money today' })}
      actionLabel={t('dashboard.money.action', {
        defaultValue: 'Cash entries',
      })}
      onAction={onOpenCashEntries}
    >
      <View className="px-4 py-2">
        <Line label={t('dashboard.money.cashSales')} value={cashSales} />
        <Line label={t('dashboard.money.collected')} value={collected} />
        <Line label={t('dashboard.money.expenses')} value={-expenses} />
        <Line label={t('dashboard.money.drawings')} value={-drawings} />
        <View className="border-t border-dashed border-ink-200 mt-1 pt-1">
          <Line label={t('dashboard.money.net')} value={net} strong />
        </View>
      </View>
    </DashboardSection>
  );
});

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  const text = value < 0 ? `-${formatPesos(-value)}` : formatPesos(value);
  const tone = strong
    ? value < 0
      ? 'text-semantic-danger'
      : 'text-ink-900'
    : value < 0
      ? 'text-ink-600'
      : 'text-ink-900';

  return (
    <View
      className="flex-row items-center justify-between py-2"
      accessible
      accessibilityLabel={`${label}, ${text}`}
    >
      <StyledText
        variant={strong ? 'extrabold' : 'regular'}
        className={`text-sm ${strong ? 'text-ink-900' : 'text-ink-600'}`}
      >
        {label}
      </StyledText>
      <StyledText
        variant={strong ? 'extrabold' : 'semibold'}
        className={`${strong ? 'text-base' : 'text-sm'} ${tone}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {text}
      </StyledText>
    </View>
  );
}
