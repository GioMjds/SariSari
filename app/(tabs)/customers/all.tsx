import { useMemo } from 'react';
import { View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { AllCustomersTab, CustomersSkeleton } from '@/components/customers';
import { useCollectionQueue, useCustomers } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';
import { Customer } from '@/types/credits.types';

export default function AllCustomersScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { data: customers = [], isLoading } = useCustomers();
  // Same query the To collect tab uses, so it is already cached.
  const { data: queue } = useCollectionQueue();

  const overdueById = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of queue ?? []) {
      if (row.overdueDays > 0) map.set(row.customerId, row.overdueDays);
    }
    return map;
  }, [queue]);

  const handleSelectCustomer = (customer: Customer) => {
    router.push({
      pathname: '/(edit-forms)/credit-details/[id]',
      params: { id: customer.id },
    });
  };

  const handleAddCustomer = () => {
    router.push('/(edit-forms)/add-customer' as Href);
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-paper-200"
        style={{ paddingBottom: tabBarBottomOffset }}
      >
        <CustomersSkeleton />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingBottom: tabBarBottomOffset }}
    >
      <AllCustomersTab
        customers={customers}
        overdueById={overdueById}
        onSelectCustomer={handleSelectCustomer}
        onAddCustomer={handleAddCustomer}
      />
    </View>
  );
}
