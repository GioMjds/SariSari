import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function EditFormsLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#EFE6D2" />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'formSheet',
          animation: 'fade',
          gestureEnabled: true,
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          sheetInitialDetentIndex: 'last',
          contentStyle: { backgroundColor: '#FAF7F0' },
        }}
      />
    </>
  );
}
