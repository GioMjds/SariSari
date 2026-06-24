import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function AddSalesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new Sell tab with the new-sale segment selected
    router.replace('/(tabs)/sell?tab=new-sale' as any);
  }, [router]);

  return (
    <View className="flex-1 bg-background justify-center items-center">
      <ActivityIndicator size="large" color="#B45309" />
    </View>
  );
}
