import { View } from 'react-native';
import { Payment } from '@/types/credits.types';
import { TabContentSearch } from './TabContentSearch';
import { PaymentCard } from './PaymentCard';
import { PaymentsEmptyState } from './PaymentsEmptyState';
import { NoMatchesState } from './NoMatchesState';

interface PaymentsTabContentProps {
  /** Already-filtered payment list. */
  payments: Payment[];
  /** Total count before filtering — drives the "X of Y" caption. */
  totalCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
}

/**
 * PaymentsTabContent — body of the "Payments" tab.
 *
 * Mirrors `CreditsTabContent` for visual consistency: empty state
 * when the suki has never paid, no-matches when the filter excludes
 * everything, and a `TabContentSearch` + animated `PaymentCard`
 * list otherwise.
 */
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
          noun="payment"
          placeholder="Search payment notes…"
        />
        <NoMatchesState noun="payment" />
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
        noun="payment"
        placeholder="Search payment notes…"
      />
      {payments.map((payment, idx) => (
        <PaymentCard key={payment.id} payment={payment} index={idx} />
      ))}
    </View>
  );
}
