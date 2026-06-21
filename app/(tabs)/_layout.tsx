import { StyledTab } from '@/components/layout';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, animation: 'ios_from_right' }}
      />
      <StyledTab />
    </>
  );
}
