import { memo } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { MotiView } from 'moti';
import { Customer } from '@/types';
import { MoneyText, StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
interface CreditsCustomerCardProps {
  customer: Customer;
  index: number;
  onOpenDetails: (customer: Customer) => void;
  onAddPayment: (customer: Customer) => void;
  onAddCredit: (customer: Customer) => void;
}

/**
 * CreditsCustomerCard — paper card for one suki. Reads like a
 * torn-out receipt page: customer name in heavy ink on the left,
 * amount owed anchored right, dashed divider, then two quick
 * actions for the most common follow-up moves (collect a payment
 * or extend more credit).
 *
 * Tapping the body opens customer details; the two pill buttons
 * route to the add-payment and add-credit forms respectively.
 */
export const CreditsCustomerCard = memo(function CreditsCustomerCard({
  customer,
  index,
  onOpenDetails,
  onAddPayment,
  onAddCredit,
}: CreditsCustomerCardProps) {
  const hasBalance = customer.outstanding_balance > 0;
  const isOverdue = customer.tag === 'overdue';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 80 + index * 40 }}
    >
      <Pressable
        onPress={() => onOpenDetails(customer)}
        android_ripple={{ color: '#EAE6DF' }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${customer.name} ledger`}
        className={`bg-paper-50 mx-4 mb-3 rounded-2xl border ${
          isOverdue ? 'border-semantic-danger-100' : 'border-ink-100'
        } overflow-hidden`}
        style={{
          shadowColor: '#564E45',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {/* Card body */}
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1">
                {isOverdue && (
                  <View className="w-1.5 h-1.5 rounded-full bg-semantic-danger mr-1.5" />
                )}
                <StyledText
                  variant="black"
                  className="text-ink-900 text-base"
                  numberOfLines={1}
                >
                  {customer.name}
                </StyledText>
              </View>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs"
                numberOfLines={1}
              >
                {customer.phone ||
                  (customer.last_transaction_date
                    ? `Last activity ${formatDistanceToNow(new Date(customer.last_transaction_date), { addSuffix: true })}`
                    : 'No activity yet')}
              </StyledText>
            </View>

            <View className="items-end">
              <MoneyText
                value={customer.outstanding_balance}
                size="lg"
                variant={hasBalance ? 'danger' : 'success'}
                className="text-lg"
              />
              {customer.tag && customer.tag !== 'overdue' && (
                <View className="mt-1.5">
                  <StatusPill
                    variant={
                      customer.tag === 'good_payer'
                        ? 'success'
                        : customer.tag === 'frequent_borrower'
                          ? 'info'
                          : 'neutral'
                    }
                    size="sm"
                  >
                    {customer.tag === 'good_payer'
                      ? 'Good payer'
                      : customer.tag === 'frequent_borrower'
                        ? 'Frequent'
                        : '—'}
                  </StatusPill>
                </View>
              )}
            </View>
          </View>

          {/* Dashed divider */}
          <View className="border-t border-dashed border-ink-200 my-3" />

          {/* Footer: total credits + quick actions */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <FontAwesome name="book" size={10} color="#7A7165" />
              <StyledText
                variant="medium"
                className="text-mono text-ink-500 ml-1.5"
              >
                Total
              </StyledText>
              <MoneyText
                value={customer.total_credits}
                size="sm"
                variant="default"
                className="text-ink-500 text-[10px] font-medium ml-1"
              />
            </View>

            <View className="flex-row gap-1.5">
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAddPayment(customer);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add payment for ${customer.name}`}
                activeOpacity={0.85}
                className="bg-sage-500 rounded-pill px-3 py-1.5 flex-row items-center press-scale"
              >
                <FontAwesome name="money" size={10} color="#FBF7EE" />
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-[10px] ml-1.5"
                >
                  Payment
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAddCredit(customer);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add credit for ${customer.name}`}
                activeOpacity={0.85}
                className="bg-paper-100 rounded-pill px-3 py-1.5 flex-row items-center border border-ink-200 press-scale"
              >
                <FontAwesome name="plus" size={10} color="#623418" />
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-700 text-[10px] ml-1"
                >
                  Credit
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Left danger stripe for overdue */}
        {isOverdue && (
          <View
            className="absolute left-0 top-0 bottom-0 w-1 bg-semantic-danger"
          />
        )}
      </Pressable>
    </MotiView>
  );
});