import { View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { AllCustomersTab, CustomersSkeleton } from '@/components/customers';
import { useCustomers, useCreditKPIs } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';
import { Customer } from '@/types/credits.types';

export default function AllCustomersScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { data: customers = [], isLoading } = useCustomers();
  const { data: kpis } = useCreditKPIs();

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
        totalCredit={kpis?.totalOutstanding || 0}
        onSelectCustomer={handleSelectCustomer}
        onAddCustomer={handleAddCustomer}
      />
    </View>
  );
}

