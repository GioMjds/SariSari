import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CreditLedgerTab, CustomersSkeleton } from '@/components/customers';
import { useCustomers } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';
import { Customer } from '@/types/credits.types';

export default function CreditLedgerScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  useLocalSearchParams<{ filter?: string }>();
  const { data: customers = [], isLoading } = useCustomers();

  const handleSelectCustomer = (customer: Customer) => {
    router.push({
      pathname: '/(edit-forms)/credit-details/[id]',
      params: { id: customer.id },
    });
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
      <CreditLedgerTab
        customers={customers}
        onSelectCustomer={handleSelectCustomer}
      />
    </View>
  );
}
