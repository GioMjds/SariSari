import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CreditLedgerTab } from '@/components/customers';
import { useCustomers } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';
import { Customer } from '@/types/credits.types';

export default function CreditLedgerScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { data: customers = [] } = useCustomers();

  const handleSelectCustomer = (customer: Customer) => {
    router.push({
      pathname: '/(edit-forms)/credit-details/[id]',
      params: { id: customer.id },
    });
  };

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
