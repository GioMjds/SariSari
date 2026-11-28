import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const SCREEN_OPTIONS = {
  headerShown: false,
  presentation: 'card',
  // Platform slide keeps forward and back spatially distinct.
  animation: 'default',
  gestureEnabled: true,
  freezeOnBlur: true,
  contentStyle: { backgroundColor: '#FAFAF7' },
} as const;

export default function EditFormsLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <Stack screenOptions={SCREEN_OPTIONS} />
    </>
  );
}
