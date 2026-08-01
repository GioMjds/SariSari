import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';

interface CustomerQuickActionsFooterProps {
  onSell: () => void;
  onAddCredit: () => void;
  onReceivePayment: () => void;
}

export const CustomerQuickActionsFooter: React.FC<
  CustomerQuickActionsFooterProps
> = ({ onSell, onAddCredit, onReceivePayment }) => {
  return (
    <View className="p-4 bg-paper-50 border-t border-paper-200 flex-row gap-2">
      <TouchableOpacity
        onPress={onSell}
        className="flex-1 bg-cinnamon-500 py-3 rounded-xl items-center"
      >
        <StyledText variant="extrabold" className="text-white text-xs">
          Sell
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onAddCredit}
        className="flex-1 bg-amber-600 py-3 rounded-xl items-center"
      >
        <StyledText variant="extrabold" className="text-white text-xs">
          Add Credit
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onReceivePayment}
        className="flex-1 bg-sage-600 py-3 rounded-xl items-center"
      >
        <StyledText variant="extrabold" className="text-white text-xs">
          Payment
        </StyledText>
      </TouchableOpacity>
    </View>
  );
};
