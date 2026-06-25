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
        // `sheetAllowedDetents` intentionally omitted: providing `[1.0]`
        // alone sends react-native-screens down the custom-detent code
        // path, which on iOS in this version renders the sheet at a
        // partial width on phone-class devices. Falling back to the
        // system default (medium / large) and forcing the initial
        // detent to 'last' gives a full-height sheet on iPhone while
        // preserving drag-to-resize on iPad.
        sheetInitialDetentIndex: 'last',
        // Pin the form-sheet scene to the form's own cream background so
        // Android's pre-API-33 formSheet fallback does not show a white
        // activity background during the back-gesture dismissal animation.
        contentStyle: { backgroundColor: '#FAF7F0' },
      }}
    />
  );
}
