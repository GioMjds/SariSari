import { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format, isValid } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { CreditHistory, Payment } from '@/types/credits.types';
import { formatPesos } from '@/lib/money';
import {
  groupLedgerByMonth,
  matchesSearch,
  type LedgerMonth,
} from '@/lib/creditDetails';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StyledText } from '@/components/elements';
import { SEARCH_MIN_ITEMS, TabContentSearch } from './TabContentSearch';
import { LedgerEmptyState } from './LedgerEmptyState';
import { methodLabel } from './labels';

type LedgerFilter = 'all' | 'credit' | 'payment';

// Rows rendered per page; the ledger sits inside a ScrollView, not a list.
const PAGE_SIZE = 40;

interface LedgerTabContentProps {
  history: CreditHistory[];
  payments: Payment[];
  searchValue: string;
  onSearchChange: (next: string) => void;
}

export function LedgerTabContent({
  history,
  payments,
  searchValue,
  onSearchChange,
}: LedgerTabContentProps) {
  const { t } = useTranslation('utang');
  const [filter, setFilter] = useState<LedgerFilter>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const paymentById = useMemo(
    () => new Map(payments.map((p) => [p.id, p])),
    [payments],
  );

  const counts = useMemo(() => {
    const credit = history.filter((h) => h.type === 'credit').length;
    return { all: history.length, credit, payment: history.length - credit };
  }, [history]);

  const months = useMemo(() => {
    const filtered = history.filter(
      (h) =>
        (filter === 'all' || h.type === filter) &&
        matchesSearch(searchValue, [h.description]),
    );
    return groupLedgerByMonth(filtered);
  }, [history, filter, searchValue]);

  if (history.length === 0) {
    return (
      <LedgerEmptyState
        title={t('detailLedgerEmptyTitle')}
        body={t('detailLedgerEmptyBody')}
      />
    );
  }

  const shownTotal = months.reduce((n, m) => n + m.entries.length, 0);

  // Spend the row budget month by month so headers keep their full totals.
  let budget = limit;
  const visible: LedgerMonth[] = [];
  for (const month of months) {
    if (budget <= 0) break;
    visible.push({ ...month, entries: month.entries.slice(0, budget) });
    budget -= month.entries.length;
  }

  const filters: { key: LedgerFilter; label: string }[] = [
    { key: 'all', label: t('detailFilterAll') },
    { key: 'credit', label: t('detailFilterCredits') },
    { key: 'payment', label: t('detailFilterPayments') },
  ];

  return (
    <View>
      {history.length >= SEARCH_MIN_ITEMS && (
        <TabContentSearch
          value={searchValue}
          onChange={onSearchChange}
          resultCount={shownTotal}
          totalCount={history.length}
          placeholder={t('detailSearchLedger')}
        />
      )}

      <View className="flex-row gap-2 mb-3" accessibilityRole="radiogroup">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                setFilter(f.key);
                setLimit(PAGE_SIZE);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              className={`press-scale min-h-[40px] px-3.5 rounded-pill flex-row items-center border ${
                active
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant={active ? 'extrabold' : 'semibold'}
                className={`text-sm ${active ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {f.label}
              </StyledText>
              <StyledText
                variant="medium"
                className={`text-xs ml-1.5 ${active ? 'text-paper-200' : 'text-ink-500'}`}
              >
                {counts[f.key]}
              </StyledText>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <LedgerEmptyState
          title={t('detailNoMatchTitle')}
          body={t('detailNoMatchBody')}
        />
      ) : (
        visible.map((month) => (
          <View key={month.key} className="mb-4">
            <View className="flex-row items-baseline justify-between mb-2 px-1">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-base"
                accessibilityRole="header"
              >
                {month.date
                  ? format(month.date, 'MMMM yyyy')
                  : t('detailMonthUnknown')}
              </StyledText>
              <StyledText variant="medium" className="text-mono text-ink-500">
                {[
                  month.credited > 0
                    ? t('detailMonthCredited', {
                        amount: formatPesos(month.credited),
                      })
                    : null,
                  month.paid > 0
                    ? t('detailMonthPaid', { amount: formatPesos(month.paid) })
                    : null,
                ]
                  .filter(Boolean)
                  .join('  ')}
              </StyledText>
            </View>
            <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
              {month.entries.map((entry, i) => (
                <LedgerRow
                  key={`${entry.type}-${entry.id}`}
                  entry={entry}
                  payment={
                    entry.type === 'payment'
                      ? paymentById.get(entry.id)
                      : undefined
                  }
                  first={i === 0}
                />
              ))}
            </View>
          </View>
        ))
      )}

      {shownTotal > limit && (
        <Pressable
          onPress={() => setLimit((l) => l + PAGE_SIZE)}
          accessibilityRole="button"
          className="press-scale min-h-[44px] mb-3 rounded-xl border border-ink-200 bg-paper-50 items-center justify-center"
        >
          <StyledText variant="semibold" className="text-ink-700 text-sm">
            {t('detailShowMore', {
              count: Math.min(PAGE_SIZE, shownTotal - limit),
            })}
          </StyledText>
        </Pressable>
      )}
    </View>
  );
}

const LedgerRow = memo(function LedgerRow({
  entry,
  payment,
  first,
}: {
  entry: CreditHistory;
  payment: Payment | undefined;
  first: boolean;
}) {
  const { t } = useTranslation('utang');
  const isCredit = entry.type === 'credit';
  const date = parseStoredTimestamp(entry.date);
  // The DB fills blank descriptions with English 'Credit' or 'Payment'.
  const raw = entry.description?.trim();
  const description =
    raw && raw !== (isCredit ? 'Credit' : 'Payment')
      ? raw
      : t(isCredit ? 'detailCreditFallback' : 'detailPaymentFallback');

  const meta = [
    date && isValid(date) ? format(date, 'MMM d · h:mm a') : t('detailUnknownDate'),
    payment ? methodLabel(t, payment.payment_method) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const amount = `${isCredit ? '+' : '-'}${formatPesos(entry.amount)}`;
  const balance = t('detailRunningBalance', {
    amount: formatPesos(entry.running_balance),
  });

  return (
    <View
      accessible
      accessibilityLabel={`${description}, ${amount}, ${meta}, ${balance}`}
      className={`flex-row items-center px-3.5 py-3 ${
        first ? '' : 'border-t border-dashed border-ink-150'
      }`}
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${
          isCredit ? 'bg-persimmon-50' : 'bg-sage-50'
        }`}
      >
        <FontAwesome
          name={isCredit ? 'shopping-basket' : 'check'}
          size={13}
          color={isCredit ? '#C8460F' : '#4F7A24'}
        />
      </View>
      <View className="flex-1 mx-3">
        <StyledText
          variant="semibold"
          className="text-ink-900 text-sm"
          numberOfLines={1}
        >
          {description}
        </StyledText>
        <StyledText
          variant="medium"
          className="text-mono text-ink-500 mt-0.5"
          numberOfLines={1}
        >
          {meta}
        </StyledText>
      </View>
      <View className="items-end">
        <StyledText
          variant="extrabold"
          className={`text-sm ${isCredit ? 'text-ink-900' : 'text-sage-700'}`}
        >
          {amount}
        </StyledText>
        <StyledText variant="medium" className="text-mono text-ink-500 mt-0.5">
          {balance}
        </StyledText>
      </View>
    </View>
  );
});
