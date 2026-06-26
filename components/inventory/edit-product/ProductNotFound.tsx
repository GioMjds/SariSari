import { FontAwesome } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';

interface ProductNotFoundProps {
  onBack: () => void;
}

/**
 * ProductNotFound — empty branch shown when the product query
 * resolves to `undefined`. Replaces the original screen's
 * inline not-found view.
 */
export function ProductNotFound({ onBack }: ProductNotFoundProps) {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
      <FontAwesome
        name="exclamation-circle"
        size={64}
        color="#C13030"
        style={{ opacity: 0.5 }}
      />
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-xl mt-4 text-center"
      >
        Product Not Found
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mt-2 text-center"
      >
        This product may have been deleted from another device.
      </StyledText>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="press-scale mt-6 bg-persimmon-500 rounded-pill px-6 py-3 shadow-persimmon-glow"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          Go Back
        </StyledText>
      </Pressable>
    </SafeAreaView>
  );
}