import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Receipt detail route. Sale rows currently route to the dedicated
 * sale-details edit-form screen; this route stays valid as a swipe
 * target and forwards to that screen when reached with an id.
 */
export default function SaleDetailRedirect() {
  const { detail } = useLocalSearchParams<{ detail: string }>();

  if (!detail) {
    return <Redirect href="/(tabs)/sales/receipts" />;
  }

  return <Redirect href={`/(edit-forms)/sale-details/${detail}` as any} />;
}
