import { Redirect } from 'expo-router';

export default function HomeIndexRedirect() {
  return <Redirect href="/(tabs)/home/overview" />;
}
