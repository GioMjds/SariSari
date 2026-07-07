import { StyledText } from '@/components/elements';
import { CustomerWithDetails } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';

export function ContactRow({ customer }: { customer: CustomerWithDetails }) {
  if (!customer.phone && !customer.address) return null;
  return (
    <View className="mt-1.5">
      {customer.phone && (
        <View className="flex-row items-center mb-0.5">
          <FontAwesome
            name="phone"
            size={10}
            color="#FBF7EE"
            style={{ opacity: 0.7 }}
          />
          <StyledText
            variant="medium"
            className="text-mono text-paper-200 ml-1.5"
            style={{ opacity: 0.92 }}
          >
            {customer.phone}
          </StyledText>
        </View>
      )}
      {customer.address && (
        <View className="flex-row items-center">
          <FontAwesome
            name="map-marker"
            size={10}
            color="#FBF7EE"
            style={{ opacity: 0.7 }}
          />
          <StyledText
            variant="medium"
            className="text-mono text-paper-200 ml-1.5"
            numberOfLines={1}
            style={{ opacity: 0.92 }}
          >
            {customer.address}
          </StyledText>
        </View>
      )}
    </View>
  );
}
