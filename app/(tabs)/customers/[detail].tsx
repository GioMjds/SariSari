import React from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomerDetails, useCustomerTimeline } from '@/hooks/useCredits';
import { CustomerProfileHeader } from '@/components/customers/CustomerProfileHeader';
import { CustomerTimelineFeed } from '@/components/customers/CustomerTimelineFeed';
import { CustomerQuickActionsFooter } from '@/components/customers/CustomerQuickActionsFooter';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';

export default function CustomerDetailScreen() {
  const { detail } = useLocalSearchParams<{ detail: string }>();
  const router = useRouter();
  const customerId = parseInt(detail || '0', 10);

  const {
    data: customer,
    isPending,
    isFetching: fetchingCustomer,
  } = useCustomerDetails(customerId);
  const { data: timeline = [] } = useCustomerTimeline(customerId);

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <StyledText variant="extrabold" className="text-ink-700">
          Loading Customer Profile...
        </StyledText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1">
        <CustomerProfileHeader customer={customer} />

        <View className="mx-4 p-4 bg-paper-100 rounded-xl border border-paper-200 flex-row justify-around">
          <View className="items-center">
            <StyledText variant="regular" className="text-ink-400 text-xs">
              Outstanding
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-cinnamon-700 text-base"
            >
              {formatPesos(customer.outstanding_balance)}
            </StyledText>
          </View>

          <View className="items-center">
            <StyledText variant="regular" className="text-ink-400 text-xs">
              Total Credits
            </StyledText>
            <StyledText variant="extrabold" className="text-ink-700 text-base">
              {formatPesos(customer.total_credits)}
            </StyledText>
          </View>

          <View className="items-center">
            <StyledText variant="regular" className="text-ink-400 text-xs">
              Total Paid
            </StyledText>
            <StyledText variant="extrabold" className="text-sage-700 text-base">
              {formatPesos(customer.total_payments)}
            </StyledText>
          </View>
        </View>

        <CustomerTimelineFeed items={timeline} />
      </ScrollView>

      <CustomerQuickActionsFooter
        onSell={() => router.push('/(tabs)/sales/pos')}
        onAddCredit={() =>
          router.push({
            pathname: '/(edit-forms)/add-credit/[id]',
            params: { id: customer.id },
          })
        }
        onReceivePayment={() =>
          router.push({
            pathname: '/(edit-forms)/add-payment/[id]',
            params: { id: customer.id },
          })
        }
      />
    </SafeAreaView>
  );
}
