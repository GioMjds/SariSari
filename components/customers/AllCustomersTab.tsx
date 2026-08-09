import { useState, useMemo, FC } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { SearchBar } from '@/components/ui';
import { CustomerFilterChips } from './CustomerFilterChips';
import { CustomerCard } from './CustomerCard';
import { CustomersEmptyState } from './CustomersEmptyState';
import { Customer, ExtendedCreditFilter } from '@/types/credits.types';
import { StyledText } from '@/components/elements';
import * as Haptics from 'expo-haptics';

interface AllCustomersTabProps {
  customers: Customer[];
  totalCredit: number;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
}

export const AllCustomersTab: FC<AllCustomersTabProps> = ({
  customers,
  totalCredit,
  onSelectCustomer,
  onAddCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExtendedCreditFilter>('all');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
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

    result.sort((a, b) => {
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    return result;
  }, [customers, search, activeFilter, sortAsc]);

  const toggleSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSortAsc((prev) => !prev);
  };

  return (
    <View className="flex-1 bg-paper-200">
      {/* Search Input Bar */}
      <View className="px-4 mt-1 mb-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search customer name..."
        />
      </View>

      {/* Filter Chips Row */}
      <CustomerFilterChips
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* Directory Section Header */}
      <View className="px-4 py-2 flex-row justify-between items-center mb-1">
        <StyledText variant="extrabold" className="text-ink-900 text-lg">
          Directory
        </StyledText>
        <TouchableOpacity
          onPress={toggleSort}
          activeOpacity={0.7}
          className="flex-row items-center py-1 px-2"
        >
          <StyledText variant="extrabold" className="text-cinnamon-500 text-xs mr-1">
            SORT {sortAsc ? '▲' : '▼'}
          </StyledText>
        </TouchableOpacity>
      </View>

      {/* Customer List */}
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
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};
