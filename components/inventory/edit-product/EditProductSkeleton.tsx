import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';

/**
 * EditProductSkeleton — loading branch shown while the product
 * query is in-flight. Centered ActivityIndicator on the parchment
 * background; matches the original screen's loading state.
 */
export function EditProductSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#B45309" />
      <StyledText
        variant="medium"
        className="text-ink-500 text-sm mt-3"
      >
        Loading product…
      </StyledText>
    </SafeAreaView>
  );
}