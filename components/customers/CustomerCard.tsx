import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Customer } from '@/types/credits.types';
import { CustomerAvatar } from './CustomerAvatar';
import { LoyaltyBadge } from './LoyaltyBadge';
import { formatPesos } from '@/lib';

interface CustomerCardProps {
  customer: Customer;
  onPress: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onPress,
}) => {
  const hasBalance = customer.outstanding_balance > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(customer)}
      className="mx-4 mb-2.5 p-3.5 bg-paper-50 rounded-xl border border-paper-200 flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1 mr-2">
        <CustomerAvatar name={customer.name} photoUri={customer.photo_uri} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center flex-wrap gap-1">
            <StyledText variant="extrabold" className="text-ink-800 text-sm">
              {customer.name}
            </StyledText>
            <LoyaltyBadge tier={customer.loyalty_tier || 'new'} />
          </View>
          {customer.phone && (
            <StyledText
              variant="regular"
              className="text-ink-400 text-xs mt-0.5"
            >
              {customer.phone}
            </StyledText>
          )}
        </View>
      </View>

      <View className="items-end">
        {hasBalance ? (
          <View className="bg-cinnamon-50 px-2 py-1 rounded-lg border border-cinnamon-200 items-end">
            <StyledText
              variant="regular"
              className="text-cinnamon-700 text-[10px]"
            >
              Outstanding
            </StyledText>
            <StyledText variant="extrabold" className="text-cinnamon-700 text-xs">
              {formatPesos(customer.outstanding_balance)}
            </StyledText>
          </View>
        ) : (
          <View className="bg-sage-50 px-2 py-1 rounded-lg border border-sage-200 items-end">
            <StyledText variant="regular" className="text-sage-700 text-[10px]">
              Cleared
            </StyledText>
            <StyledText variant="semibold" className="text-sage-700 text-xs">
              ₱0
            </StyledText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
