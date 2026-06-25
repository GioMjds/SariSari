import { StyledTab } from '@/components/layout';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animation: 'ios_from_right',
          animationDuration: 250,
        }}
      />
      <StyledTab />
    </>
  );
}
