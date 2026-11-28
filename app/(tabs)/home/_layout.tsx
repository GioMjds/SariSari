import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false, freezeOnBlur: true } as const;

export default function HomeLayout() {
  return <Stack screenOptions={SCREEN_OPTIONS} initialRouteName="index" />;
}
