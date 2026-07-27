import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import {
  AllCustomersTab,
  CreditLedgerTab,
  CustomerInsightsTab,
} from '@/components/customers';
import {
  useCustomers,
  useCreditKPIs,
  useCustomerInsights,
} from '@/hooks/useCredits';
import { useRouter } from 'expo-router';
import { Customer } from '@/types/credits.types';

type TabRoute = 'all' | 'credit' | 'insights';

export default function CustomersScreen() {
  const [activeTab, setActiveTab] = useState<TabRoute>('all');
  const router = useRouter();

  const { data: customers = [] } = useCustomers();
  const { data: kpis } = useCreditKPIs();
  const { data: insights } = useCustomerInsights();

  const handleSelectCustomer = (customer: Customer) => {
    router.push({
      pathname: '/(tabs)/customers/[detail]',
      params: { detail: customer.id },
    });
  };

  const handleAddCustomer = () => {
    router.push('/(edit-forms)/add-customer');
  };

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-background">
        <View className="bg-cinnamon-500 px-4 pt-3 pb-2 flex-row justify-around border-b border-cinnamon-600">
          {(['all', 'credit', 'insights'] as TabRoute[]).map((t) => {
            const isActive = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                className={`pb-1.5 px-4 ${isActive ? 'border-b-2 border-white' : ''}`}
              >
                <StyledText
                  variant={isActive ? 'extrabold' : 'medium'}
                  className={`text-sm capitalize ${isActive ? 'text-white' : 'text-cinnamon-200'}`}
                >
                  {t}
                </StyledText>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'all' && (
          <AllCustomersTab
            customers={customers}
            totalCredit={kpis?.totalOutstanding || 0}
            onSelectCustomer={handleSelectCustomer}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'credit' && (
          <CreditLedgerTab
            customers={customers}
            onSelectCustomer={handleSelectCustomer}
          />
        )}

        {activeTab === 'insights' && (
          <CustomerInsightsTab insights={insights} />
        )}
      </View>
    </SafeAreaView>
  );
}
