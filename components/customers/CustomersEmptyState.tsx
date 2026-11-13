import { FC } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

interface CustomersEmptyStateProps {
  onAddCustomer?: () => void;
  title?: string;
  description?: string;
}

export const CustomersEmptyState: FC<CustomersEmptyStateProps> = ({
  onAddCustomer,
  title = 'No Customers Yet',
  description = 'Track loyal buyers, manage store credit, and understand your best customers.',
}) => {
  return (
    <View className="items-center justify-center p-8 mt-4">
      <SariMascot state="utang" size={130} />
      <StyledText
        variant="extrabold"
        className="text-ink-800 text-lg mt-4 text-center"
      >
        {title}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-xs mt-1.5 text-center leading-5 px-4"
      >
        {description}
      </StyledText>

      {onAddCustomer && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAddCustomer}
          className="mt-5 px-5 py-2.5 bg-cinnamon-500 rounded-full active:scale-[0.98]"
        >
          <StyledText variant="extrabold" className="text-white text-sm">
            Add Customer
          </StyledText>
        </TouchableOpacity>
      )}
    </View>
  );
};
