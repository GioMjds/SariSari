import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CreditTransaction } from '@/types/credits.types';
import { formatPesos } from '@/lib/money';
import { matchesSearch } from '@/lib/creditDetails';
import { StyledText } from '@/components/elements';
import { SEARCH_MIN_ITEMS, TabContentSearch } from './TabContentSearch';
import { UtangCard } from './UtangCard';
import { LedgerEmptyState } from './LedgerEmptyState';

interface UtangTabContentProps {
  /** Oldest first, the order payments are allocated. */
  open: CreditTransaction[];
  /** Newest first. */
  settled: CreditTransaction[];
  searchValue: string;
  onSearchChange: (next: string) => void;
  onQuickSettle: (credit: CreditTransaction) => void;
}

const matchCredit = (term: string) => (c: CreditTransaction) =>
  matchesSearch(term, [c.product_name, c.notes]);

export function UtangTabContent({
  open,
  settled,
  searchValue,
  onSearchChange,
  onQuickSettle,
}: UtangTabContentProps) {
  const { t } = useTranslation('utang');
  const [showSettled, setShowSettled] = useState(false);

  const total = open.length + settled.length;
  const searching = searchValue.trim().length > 0;

  const shownOpen = useMemo(
    () => open.filter(matchCredit(searchValue)),
    [open, searchValue],
  );
  const shownSettled = useMemo(
    () => settled.filter(matchCredit(searchValue)),
    [settled, searchValue],
  );
  const openTotal = useMemo(
    () => open.reduce((sum, c) => sum + (c.amount - c.amount_paid), 0),
    [open],
  );

  if (total === 0) {
    return (
      <LedgerEmptyState
        sari="utang"
        title={t('detailCreditsEmptyTitle')}
        body={t('detailCreditsEmptyBody')}
      />
    );
  }

  // Search reveals settled matches so nothing stays hidden behind the toggle.
  const settledVisible = showSettled || searching;
  const shownCount =
    shownOpen.length + (settledVisible ? shownSettled.length : 0);

  return (
    <View>
      {total >= SEARCH_MIN_ITEMS && (
        <TabContentSearch
          value={searchValue}
          onChange={onSearchChange}
          resultCount={shownOpen.length + shownSettled.length}
          totalCount={total}
          placeholder={t('detailSearchCredits')}
        />
      )}

      {open.length === 0 && !searching ? (
        <View className="mb-3">
          <LedgerEmptyState
            sari="balance-cleared"
            title={t('detailAllSettledTitle')}
            body={t('detailAllSettledBody')}
          />
        </View>
      ) : shownOpen.length > 0 ? (
        <>
          <View className="flex-row items-baseline justify-between mb-2 px-1">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base"
              accessibilityRole="header"
            >
              {t('detailOpenSection')} · {open.length}
            </StyledText>
            <StyledText variant="semibold" className="text-mono text-ink-600">
              {t('detailOpenTotal', { amount: formatPesos(openTotal) })}
            </StyledText>
          </View>
          {shownOpen.map((credit, idx) => (
            <UtangCard
              key={credit.id}
              credit={credit}
              index={idx}
              onQuickSettle={onQuickSettle}
            />
          ))}
        </>
      ) : null}

      {settled.length > 0 && !searching && (
        <Pressable
          onPress={() => setShowSettled((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showSettled }}
          className="press-scale flex-row items-center justify-center min-h-[44px] mb-3 rounded-xl border border-dashed border-ink-200"
        >
          <FontAwesome
            name={showSettled ? 'chevron-up' : 'chevron-down'}
            size={11}
            color="#564E45"
          />
          <StyledText variant="semibold" className="text-ink-700 text-sm ml-2">
            {showSettled
              ? t('detailSettledHide')
              : t('detailSettledShow', { count: settled.length })}
          </StyledText>
        </Pressable>
      )}

      {settledVisible &&
        shownSettled.map((credit) => (
          <UtangCard key={credit.id} credit={credit} />
        ))}

      {searching && shownCount === 0 && (
        <LedgerEmptyState
          title={t('detailNoMatchTitle')}
          body={t('detailNoMatchBody')}
        />
      )}
    </View>
  );
}
