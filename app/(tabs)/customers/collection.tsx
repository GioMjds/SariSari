import { View } from 'react-native';
import { CollectionTab } from '@/components/customers';

export default function CollectionScreen() {
  return (
    <View className="flex-1 bg-paper-200">
      <CollectionTab />
    </View>
  );
}
