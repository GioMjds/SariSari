import { useState, useMemo, useCallback, FC } from 'react';
import { View, FlatList, Pressable, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { SearchBar } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Customer } from '@/types/credits.types';
import {
  CustomerFilterChips,
  type CustomerListFilter,
} from './CustomerFilterChips';
import { CustomerCard } from './CustomerCard';
import { CustomersEmptyState } from './CustomersEmptyState';

interface AllCustomersTabProps {
  customers: Customer[];
  /** customerId -> days overdue, only for suki with overdue utang. */
  overdueById?: ReadonlyMap<number, number>;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
}

type SortKey = 'balance' | 'name' | 'recent';

const SORT_OPTIONS = [
  { key: 'balance', shortKey: 'sortShortBalance', longKey: 'sortByBalance' },
  { key: 'name', shortKey: 'sortShortName', longKey: 'sortByName' },
  { key: 'recent', shortKey: 'sortShortRecent', longKey: 'sortByRecent' },
] as const satisfies readonly {
  key: SortKey;
  shortKey: string;
  longKey: string;
}[];

export const AllCustomersTab: FC<AllCustomersTabProps> = ({
  customers,
  overdueById,
  onSelectCustomer,
  onAddCustomer,
}) => {
  const { t } = useTranslation('utang');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<CustomerListFilter>('all');
  // Biggest utang first: the owner opens this list to see who owes what.
  const [sortKey, setSortKey] = useState<SortKey>('balance');

  const counts = useMemo(() => {
    const withBalance = customers.filter(
      (c) => c.outstanding_balance > 0,
    ).length;
    return {
      all: customers.length,
      with_balance: withBalance,
      paid: customers.length - withBalance,
    } satisfies Record<CustomerListFilter, number>;
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = customers.filter((c) => {
      const matchSearch =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        (c.phone != null && c.phone.includes(q));
      if (!matchSearch) return false;

      if (activeFilter === 'with_balance') return c.outstanding_balance > 0;
      if (activeFilter === 'paid') return c.outstanding_balance <= 0;
      return true;
    });

    result.sort((a, b) => {
      if (sortKey === 'balance') {
        const diff = b.outstanding_balance - a.outstanding_balance;
        if (diff !== 0) return diff;
      } else if (sortKey === 'recent') {
        // Stored dates are ISO-like strings, so text order is date order.
        const diff = (b.last_transaction_date ?? '').localeCompare(
          a.last_transaction_date ?? '',
        );
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [customers, search, activeFilter, sortKey]);

  const selectSort = (key: SortKey) => {
    if (key === sortKey) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSortKey(key);
  };

  const clearSearchAndFilter = () => {
    setSearch('');
    setActiveFilter('all');
  };

  const renderItem = useCallback(
    ({ item }: { item: Customer }) => (
      <CustomerCard
        customer={item}
        onPress={onSelectCustomer}
        overdueDays={overdueById?.get(item.id) ?? 0}
      />
    ),
    [onSelectCustomer, overdueById],
  );

  if (customers.length === 0) {
    return (
      <View className="flex-1 bg-paper-200">
        <CustomersEmptyState onAddCustomer={onAddCustomer} />
      </View>
    );
  }

  const listHeader = (
    <View>
      <View className="px-4 mt-1 mb-2 flex-row items-center gap-2">
        <View className="flex-1">
          <SearchBar
            compact
            value={search}
            onChange={setSearch}
            placeholder={t('searchCustomersPlaceholder')}
            accessibilityLabel={t('searchCustomersPlaceholder')}
            clearAccessibilityLabel={t('searchClear')}
          />
        </View>
        <Pressable
          onPress={onAddCustomer}
          accessibilityRole="button"
          accessibilityLabel={t('addSukiA11y')}
          className="h-12 px-4 rounded-full bg-persimmon-600 flex-row items-center justify-center active:bg-persimmon-700"
        >
          <FontAwesome
            name="user-plus"
            size={14}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <StyledText
            variant="extrabold"
            maxFontSizeMultiplier={1.3}
            className="text-white text-sm"
          >
            {t('addSukiButton')}
          </StyledText>
        </Pressable>
      </View>

      <CustomerFilterChips
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        counts={counts}
      />

      <View className="px-4 mb-1 flex-row flex-wrap items-center justify-between gap-x-2">
        <StyledText variant="semibold" className="text-ink-500 text-sm">
          {t('listCount', { count: filtered.length })}
        </StyledText>
        <View className="flex-row items-center gap-1.5">
          {SORT_OPTIONS.map((option) => {
            const selected = sortKey === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => selectSort(option.key)}
                accessibilityRole="button"
                accessibilityLabel={t(option.longKey)}
                accessibilityState={{ selected }}
                className={`min-h-11 px-3 rounded-full border items-center justify-center active:opacity-70 ${
                  selected
                    ? 'bg-persimmon-50 border-persimmon-400'
                    : 'border-transparent'
                }`}
              >
                <StyledText
                  variant={selected ? 'extrabold' : 'semibold'}
                  maxFontSizeMultiplier={1.3}
                  className={`text-sm ${
                    selected ? 'text-persimmon-700' : 'text-ink-500'
                  }`}
                >
                  {t(option.shortKey)}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  const noMatches = (
    <View className="items-center px-8 py-10">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-800 text-base text-center"
      >
        {t('collectionSearchEmptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm text-center mt-1"
      >
        {t('noMatchDescription')}
      </StyledText>
      <Pressable
        onPress={clearSearchAndFilter}
        accessibilityRole="button"
        className="mt-4 min-h-11 px-5 rounded-full border border-paper-400 bg-paper-50 items-center justify-center active:bg-paper-100"
      >
        <StyledText variant="extrabold" className="text-ink-700 text-sm">
          {t('noMatchClear')}
        </StyledText>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-paper-200">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={noMatches}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
