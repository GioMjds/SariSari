import { StyledText } from '@/components/elements';
import { Pagination, SearchBar } from '@/components/ui';
import {
  CompactLedgerMetrics,
  CreditsCustomerCard,
  CreditsEmptyState,
  CreditsHeader,
  CreditsSkeleton,
  FilterBar,
  PriorityCustomerHero,
  SortDropdown,
} from '@/components/utang';
import { ITEMS_PER_PAGE } from '@/constants/stocks';
import { useCredits } from '@/hooks';
import { CreditFilter, CreditSort, Customer } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Credits() {
  const { t } = useTranslation('utang');
  const [activeFilter, setActiveFilter] = useState<CreditFilter>('all');
  const [activeSort, setActiveSort] = useState<CreditSort>('balance_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { useCustomers, useCreditKPIs, useSearchCustomers } = useCredits();

  const { control, watch, reset } = useForm({
    defaultValues: {
      searchQuery: '',
    },
  });

  const searchQuery = watch('searchQuery');

  const {
    data: customers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useCustomers(activeFilter, activeSort);

  const { data: kpis } = useCreditKPIs();

  const { data: searchResults = [] } = useSearchCustomers(searchQuery);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, activeSort, searchQuery]);

  // Filtered customers based on search
  const filteredCustomers = useMemo(() => {
    if (searchQuery.trim()) return searchResults;
    return customers;
  }, [customers, searchResults, searchQuery]);

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  // Priority customer (only considers customers that actually
  // owe money; otherwise the hero shows the cleared state).
  const priorityCustomer = useMemo<Customer | null>(() => {
    const owing = filteredCustomers.filter((c) => c.outstanding_balance > 0);
    if (owing.length === 0) return null;
    const overdue = owing.find((c) => c.tag === 'overdue');
    if (overdue) return overdue;
    return [...owing].sort(
      (a, b) => b.outstanding_balance - a.outstanding_balance,
    )[0];
  }, [filteredCustomers]);

  // Dynamic subtitle: surfaces urgency first, falls back to a
  // neutral count.
  const headerSubtitle = useMemo(() => {
    const overdue = kpis?.overdueCount ?? 0;
    if (overdue > 0) {
      return t(
        overdue === 1 ? 'subtitleOverdueSingular' : 'subtitleOverduePlural',
        { count: overdue },
      );
    }
    const totalCustomers = filteredCustomers.length;
    if (totalCustomers === 0) return t('subtitleEmpty');
    if (priorityCustomer) {
      return t('subtitleTopOfList', { name: priorityCustomer.name });
    }
    return t('subtitleLedgerClear');
  }, [kpis?.overdueCount, filteredCustomers.length, priorityCustomer, t]);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
  };

  const handleFilterChange = (filter: CreditFilter) => {
    setActiveFilter(filter);
  };

  const handleSortChange = (sort: CreditSort) => {
    setActiveSort(sort);
  };

  const handleOpenDetails = (customer: Customer) => {
    router.push({
      pathname: '/(edit-forms)/credit-details/[id]',
      params: { id: customer.id },
    });
  };

  const handleAddPayment = (customer: Customer) => {
    router.push({
      pathname: '/(edit-forms)/add-payment/[id]',
      params: { id: customer.id },
    });
  };

  const handleAddCredit = (customer: Customer) => {
    router.push({
      pathname: '/(edit-forms)/add-credit/[id]',
      params: { id: customer.id },
    });
  };

  const handleAddCustomer = () => {
    router.push('/(edit-forms)/add-customer');
  };

  const handleClearSearch = () => {
    reset({ searchQuery: '' });
  };

  const getFilterCounts = () => ({
    all: customers.length,
    with_balance: customers.filter((c) => c.outstanding_balance > 0).length,
    paid: customers.filter((c) => c.outstanding_balance === 0).length,
    overdue: kpis?.overdueCount || 0,
  });

  // ── Render: loading skeleton ────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
        <View className="flex-1 bg-background">
          <CreditsHeader
            subtitle={t('subtitleLoading')}
            onAddCustomer={handleAddCustomer}
          />
          <CreditsSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: no customers at all ─────────────────────────────
  const noCustomersAtAll = customers.length === 0 && !searchQuery.trim();

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-background">
        <CreditsHeader
          subtitle={headerSubtitle}
          onAddCustomer={handleAddCustomer}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#623418"
              colors={['#E85A1F']}
            />
          }
        >
          {/* Priority hero — only when we have at least one customer */}
          {!noCustomersAtAll && (
            <PriorityCustomerHero
              customer={priorityCustomer}
              hasOverdue={
                !!priorityCustomer && priorityCustomer.tag === 'overdue'
              }
              onAddPayment={() =>
                priorityCustomer && handleAddPayment(priorityCustomer)
              }
              onAddCredit={() =>
                priorityCustomer && handleAddCredit(priorityCustomer)
              }
              onViewDetails={() =>
                priorityCustomer && handleOpenDetails(priorityCustomer)
              }
            />
          )}

          {/* Compact metrics — only when we have customers */}
          {!noCustomersAtAll && (
            <CompactLedgerMetrics
              totalOutstandingPesos={kpis?.totalOutstanding || 0}
              collectedTodayPesos={kpis?.totalCollectedToday || 0}
              customersWithBalance={kpis?.totalCustomersWithBalance || 0}
              overdueCount={kpis?.overdueCount || 0}
            />
          )}

          {/* Search — only when we have customers */}
          {!noCustomersAtAll && (
            <View className="px-4 mb-3">
              <Controller
                control={control}
                name="searchQuery"
                render={({ field: { onChange, value } }) => (
                  <SearchBar
                    value={value}
                    onChange={onChange}
                    placeholder={t('searchCustomersPlaceholder')}
                    debounceMs={250}
                  />
                )}
              />
            </View>
          )}

          {/* Filter + sort row */}
          {!noCustomersAtAll && (
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              counts={getFilterCounts()}
            />
          )}

          {!noCustomersAtAll && (
            <View className="px-4 mb-3 flex-row items-center justify-between">
              <View>
                <StyledText variant="medium" className="text-ink-500 text-sm">
                  {filteredCustomers.length}{' '}
                  {t(
                    filteredCustomers.length === 1
                      ? 'sukiSingular'
                      : 'sukiPlural',
                  )}
                </StyledText>
                {activeFilter !== 'all' && (
                  <StyledText
                    variant="regular"
                    className="text-ink-400 text-[10px] mt-0.5"
                  >
                    {activeFilter === 'with_balance'
                      ? t('withBalance')
                      : activeFilter === 'paid'
                        ? t('allPaidUp')
                        : t('pastDueDate')}
                  </StyledText>
                )}
              </View>
              <SortDropdown
                activeSort={activeSort}
                onSortChange={handleSortChange}
              />
            </View>
          )}

          {/* List / empty / cleared state */}
          <View className="pb-8">
            {noCustomersAtAll ? (
              <CreditsEmptyState
                variant="no-customers"
                onAddPress={handleAddCustomer}
              />
            ) : filteredCustomers.length === 0 ? (
              <CreditsEmptyState
                variant={searchQuery.trim() ? 'no-search' : 'all-cleared'}
                searchTerm={searchQuery}
                onClearSearch={handleClearSearch}
              />
            ) : (
              paginatedCustomers.map((customer, index) => (
                <CreditsCustomerCard
                  key={customer.id}
                  customer={customer}
                  index={index}
                  onOpenDetails={handleOpenDetails}
                  onAddPayment={handleAddPayment}
                  onAddCredit={handleAddCredit}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Floating pagination pill */}
        {filteredCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredCustomers.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
