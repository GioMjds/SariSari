import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export function EmptyCart() {
  return (
    <View className="items-center justify-center px-8 py-10 mx-4 my-auto rounded-2xl bg-white border border-dashed border-paper-400">
      <View className="w-16 h-16 rounded-2xl bg-persimmon-50 items-center justify-center mb-3 border border-persimmon-200">
        <FontAwesome name="shopping-basket" size={24} color="#E85A1F" />
      </View>
      <StyledText
        variant="black"
        className="text-ink-900 text-base text-center"
      >
        Your cart is empty
      </StyledText>
      <StyledText
        variant="medium"
        className="text-ink-600 text-[13px] text-center mt-1 max-w-[240px]"
      >
        Pick items from the catalog to start building your order.
      </StyledText>
    </View>
  );
}
