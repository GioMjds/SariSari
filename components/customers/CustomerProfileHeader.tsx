import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from './CustomerAvatar';
import { LoyaltyBadge } from './LoyaltyBadge';
import { Customer } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';

interface CustomerProfileHeaderProps {
  customer: Customer;
}

export const CustomerProfileHeader: React.FC<CustomerProfileHeaderProps> = ({
  customer,
}) => {
  return (
    <View className="bg-paper-100 p-4 rounded-xl border border-paper-200 items-center m-4">
      <CustomerAvatar
        name={customer.name}
        photoUri={customer.photo_uri}
        size={64}
      />
      <StyledText variant="extrabold" className="text-ink-800 text-lg mt-2">
        {customer.name}
      </StyledText>
      <View className="mt-1">
        <LoyaltyBadge tier={customer.loyalty_tier || 'new'} />
      </View>

      {customer.phone && (
        <View className="flex-row items-center mt-1">
          <FontAwesome name="phone" size={12} color="#7A7165" style={{ marginRight: 6 }} />
          <StyledText variant="regular" className="text-ink-500 text-xs">
            {customer.phone}
          </StyledText>
        </View>
      )}
      {customer.birthday && (
        <View className="flex-row items-center mt-0.5">
          <FontAwesome name="birthday-cake" size={12} color="#7A7165" style={{ marginRight: 6 }} />
          <StyledText variant="regular" className="text-ink-500 text-xs">
            {customer.birthday}
          </StyledText>
        </View>
      )}
    </View>
  );
};
