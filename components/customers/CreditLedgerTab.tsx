import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';
import { SearchBar } from '@/components/ui';
import { CustomerCard } from './CustomerCard';
import { CustomersEmptyState } from './CustomersEmptyState';
import { Customer } from '@/types/credits.types';
import * as Haptics from 'expo-haptics';

interface CreditLedgerTabProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export const CreditLedgerTab: React.FC<CreditLedgerTabProps> = ({
  customers,
  onSelectCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'highest' | 'name'>('highest');

  const debtorCustomers = useMemo(() => {
    let debtors = customers.filter(
      (c) =>
        c.outstanding_balance > 0 &&
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone && c.phone.includes(search))),
    );

    if (sortBy === 'highest') {
      return debtors.sort(
        (a, b) => b.outstanding_balance - a.outstanding_balance,
      );
    }
    return debtors.sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, search, sortBy]);

  const toggleSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSortBy((prev) => (prev === 'highest' ? 'name' : 'highest'));
  };

  return (
    <View className="flex-1 bg-paper-200">
      {/* Search Bar */}
      <View className="px-4 mt-1 mb-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search customer with credit..."
        />
      </View>

      {/* Directory Section Header */}
      <View className="px-4 py-2 flex-row justify-between items-center mb-1">
        <StyledText variant="extrabold" className="text-ink-900 text-lg">
          Credit Ledger ({debtorCustomers.length})
        </StyledText>

        <TouchableOpacity
          onPress={toggleSort}
          activeOpacity={0.7}
          className="flex-row items-center py-1 px-2"
        >
          <StyledText variant="extrabold" className="text-cinnamon-500 text-xs mr-1">
            SORT ({sortBy === 'highest' ? 'DEBT' : 'NAME'}) ▾
          </StyledText>
        </TouchableOpacity>
      </View>

      {/* Debtors List */}
      {debtorCustomers.length === 0 ? (
        <CustomersEmptyState
          title="No Credit Outstanding"
          description="All customer balances are fully paid up! Great job."
        />
      ) : (
        <FlatList
          data={debtorCustomers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CustomerCard customer={item} onPress={onSelectCustomer} />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};
