import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false, freezeOnBlur: true } as const;

export default function MoreLayout() {
  return <Stack screenOptions={SCREEN_OPTIONS} />;
}
