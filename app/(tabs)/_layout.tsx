import { StyledTab } from '@/components/layout';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          contentStyle: { backgroundColor: '#EFE6D2' },
        }}
      />
      <StyledTab />
    </>
  );
}
