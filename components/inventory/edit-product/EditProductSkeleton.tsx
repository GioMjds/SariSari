import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

/**
 * EditProductSkeleton — loading branch shown while the product
 * query is in-flight. Centered loading Sari on the parchment
 * background.
 */
export function EditProductSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <SariMascot state="loading" size={96} accessibilityLabel="Loading" />
      <StyledText
        variant="medium"
        className="text-ink-500 text-sm mt-3"
      >
        Loading product…
      </StyledText>
    </SafeAreaView>
  );
}