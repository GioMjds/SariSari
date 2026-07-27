import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SearchBar } from '@/components/ui';
import { CustomerSummaryCards } from './CustomerSummaryCards';
import { CustomerFilterChips } from './CustomerFilterChips';
import { CustomerCard } from './CustomerCard';
import { CustomersEmptyState } from './CustomersEmptyState';
import { Customer, ExtendedCreditFilter } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface AllCustomersTabProps {
  customers: Customer[];
  totalCredit: number;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
}

export const AllCustomersTab: React.FC<AllCustomersTabProps> = ({
  customers,
  totalCredit,
  onSelectCustomer,
  onAddCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExtendedCreditFilter>('all');

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search));

      if (!matchSearch) return false;

      if (activeFilter === 'with_balance') return c.outstanding_balance > 0;
      if (activeFilter === 'paid') return c.outstanding_balance === 0;
      if (activeFilter === 'loyal')
        return c.loyalty_tier === 'loyal' || c.loyalty_tier === 'vip';
      if (activeFilter === 'new') return c.loyalty_tier === 'new';
      return true;
    });
  }, [customers, search, activeFilter]);

  const loyalCount = useMemo(
    () =>
      customers.filter(
        (c) => c.loyalty_tier === 'loyal' || c.loyalty_tier === 'vip',
      ).length,
    [customers],
  );

  return (
    <View className="flex-1">
      <CustomerSummaryCards
        totalCustomers={customers.length}
        totalCredit={totalCredit}
        loyalCount={loyalCount}
        activeThisWeek={Math.ceil(customers.length * 0.4)}
      />

      <View className="px-4 mt-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search customers by name or phone..."
        />
      </View>

      <CustomerFilterChips
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <CustomersEmptyState onAddCustomer={onAddCustomer} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CustomerCard customer={item} onPress={onSelectCustomer} />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onAddCustomer}
        className="absolute bottom-6 right-6 bg-cinnamon-500 px-4 py-3 rounded-full flex-row items-center shadow-lg active:scale-95"
      >
        <FontAwesome name="plus" size={16} color="#FFFFFF" />
        <StyledText variant="extrabold" className="text-white text-sm ml-2">
          Add Customer
        </StyledText>
      </TouchableOpacity>
    </View>
  );
};
