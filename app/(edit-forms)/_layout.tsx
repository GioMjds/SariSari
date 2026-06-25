import { Stack } from 'expo-router';

export default function EditFormsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'formSheet',
        animation: 'slide_from_bottom',
        gestureEnabled: true,
        sheetGrabberVisible: true,
        sheetCornerRadius: 24,
        sheetAllowedDetents: [1.0],
      }}
    />
  );
}
