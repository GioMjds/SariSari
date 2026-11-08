import { View } from 'react-native';
import { CollectionTab } from '@/components/customers';
import { useTabBarBottomOffset } from '@/components/layout';

export default function CollectionScreen() {
  const tabBarBottomOffset = useTabBarBottomOffset();

  return (
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingBottom: tabBarBottomOffset }}
    >
      <CollectionTab />
    </View>
  );
}
