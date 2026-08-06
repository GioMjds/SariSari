import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function EditFormsLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'formSheet',
          animation: 'fade',
          gestureEnabled: true,
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          sheetInitialDetentIndex: 'last',
          contentStyle: { backgroundColor: '#FAFAF7' },
        }}
      >
        <Stack.Screen name="add-category/index" />
        <Stack.Screen name="add-supplier/index" />
        {/* Credit flows push as full-screen cards so users can scroll the form
            without the sheet's drag-to-dismiss gesture swallowing the gesture. */}
        <Stack.Screen
          name="add-payment/[id]"
          options={{ presentation: 'card', animation: 'fade' }}
        />
        <Stack.Screen
          name="add-credit/[id]"
          options={{ presentation: 'card', animation: 'fade' }}
        />
      </Stack>
    </>
  );
}
