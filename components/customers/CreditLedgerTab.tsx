import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';
import { CustomerCard } from './CustomerCard';
import { CustomersEmptyState } from './CustomersEmptyState';
import { Customer } from '@/types/credits.types';

interface CreditLedgerTabProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export const CreditLedgerTab: React.FC<CreditLedgerTabProps> = ({
  customers,
  onSelectCustomer,
}) => {
  const [sortBy, setSortBy] = useState<'highest' | 'name'>('highest');

  const debtorCustomers = useMemo(() => {
    const debtors = customers.filter((c) => c.outstanding_balance > 0);
    if (sortBy === 'highest') {
      return debtors.sort(
        (a, b) => b.outstanding_balance - a.outstanding_balance,
      );
    }
    return debtors.sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, sortBy]);

  return (
    <View className="flex-1">
      <View className="px-4 py-2 flex-row justify-between items-center">
        <StyledText variant="extrabold" className="text-ink-800 text-sm">
          {debtorCustomers.length} Customers with Credit
        </StyledText>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSortBy('highest')}
            className={`px-2.5 py-1 rounded-lg border ${
              sortBy === 'highest'
                ? 'bg-cinnamon-500 border-cinnamon-500'
                : 'bg-paper-100 border-paper-300'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-xs ${sortBy === 'highest' ? 'text-white' : 'text-ink-600'}`}
            >
              Highest Debt
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy('name')}
            className={`px-2.5 py-1 rounded-lg border ${
              sortBy === 'name'
                ? 'bg-cinnamon-500 border-cinnamon-500'
                : 'bg-paper-100 border-paper-300'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-xs ${sortBy === 'name' ? 'text-white' : 'text-ink-600'}`}
            >
              Name
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>

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
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
};
