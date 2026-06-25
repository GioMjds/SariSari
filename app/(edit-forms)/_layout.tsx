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
        // Pin the form-sheet scene to the form's own cream background so
        // Android's pre-API-33 formSheet fallback does not show a white
        // activity background during the back-gesture dismissal animation.
        contentStyle: { backgroundColor: '#FAF7F0' },
      }}
    />
  );
}
