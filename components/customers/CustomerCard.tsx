import { FC } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Customer } from '@/types/credits.types';
import { CustomerAvatar } from './CustomerAvatar';
import { LoyaltyBadge } from './LoyaltyBadge';

interface CustomerCardProps {
  customer: Customer;
  onPress: (customer: Customer) => void;
}

export const CustomerCard: FC<CustomerCardProps> = ({ customer, onPress }) => {
  const hasBalance = customer.outstanding_balance > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(customer)}
      className="mx-4 mb-3 p-3.5 bg-paper-100 rounded-2xl border border-paper-200 flex-row items-center justify-between shadow-sm"
    >
      <View className="flex-row items-center flex-1 mr-2">
        <CustomerAvatar name={customer.name} photoUri={customer.photo_uri} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center flex-wrap gap-1.5">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              {customer.name}
            </StyledText>
            <LoyaltyBadge tier={customer.loyalty_tier || 'new'} />
          </View>
          {customer.phone ? (
            <StyledText
              variant="medium"
              className="text-ink-400 text-xs mt-0.5"
            >
              {customer.phone}
            </StyledText>
          ) : null}
        </View>
      </View>

      <View className="items-end">
        {hasBalance ? (
          <View className="bg-cinnamon-50 px-3 py-1.5 rounded-xl border border-cinnamon-200 items-end">
            <StyledText
              variant="semibold"
              className="text-cinnamon-600 text-[10px] uppercase tracking-wider"
            >
              Outstanding
            </StyledText>
          </View>
        ) : (
          <View className="bg-sage-50 px-3 py-1.5 rounded-xl border border-sage-200 items-end">
            <StyledText
              variant="semibold"
              className="text-sage-700 text-[10px] uppercase tracking-wider"
            >
              Cleared
            </StyledText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
