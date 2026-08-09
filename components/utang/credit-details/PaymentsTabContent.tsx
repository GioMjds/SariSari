import { View } from 'react-native';
import { Payment } from '@/types/credits.types';
import { TabContentSearch } from './TabContentSearch';
import { PaymentCard } from './PaymentCard';
import { PaymentsEmptyState } from './PaymentsEmptyState';
import { NoMatchesState } from './NoMatchesState';

interface PaymentsTabContentProps {
  payments: Payment[];
  totalCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
}

export function PaymentsTabContent({
  payments,
  totalCount,
  searchValue,
  onSearchChange,
}: PaymentsTabContentProps) {
  if (payments.length === 0 && totalCount === 0) {
    return <PaymentsEmptyState />;
  }
  if (payments.length === 0) {
    return (
      <View>
        <TabContentSearch
          value={searchValue}
          onChange={onSearchChange}
          resultCount={0}
          totalCount={totalCount}
          noun="Payment"
          placeholder="Search payment notes…"
        />
        <NoMatchesState noun="Payment" />
      </View>
    );
  }
  return (
    <View>
      <TabContentSearch
        value={searchValue}
        onChange={onSearchChange}
        resultCount={payments.length}
        totalCount={totalCount}
        noun="Payment"
        placeholder="Search payment notes…"
      />
      {payments.map((payment, idx) => (
        <PaymentCard key={payment.id} payment={payment} index={idx} />
      ))}
    </View>
  );
}
