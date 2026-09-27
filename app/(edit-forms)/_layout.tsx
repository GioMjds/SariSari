import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function EditFormsLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animation: 'fade',
          gestureEnabled: true,
          contentStyle: { backgroundColor: '#FAFAF7' },
        }}
      >
        <Stack.Screen name="add-product/index" />
        <Stack.Screen name="edit-product/[id]" />
        <Stack.Screen name="product-details/[id]" />
        <Stack.Screen name="inventory-ledger/[productId]" />
        <Stack.Screen name="add-category/index" />
        <Stack.Screen name="add-supplier/index" />
        <Stack.Screen name="add-payment/[id]" />
        <Stack.Screen name="add-credit/[id]" />
        <Stack.Screen name="sale-correction/[id]" />
        <Stack.Screen name="price-correction/[id]" />
      </Stack>
    </>
  );
}
