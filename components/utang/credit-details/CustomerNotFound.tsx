import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';

interface CustomerNotFoundProps {
  onBack: () => void;
}

/**
 * CustomerNotFound — friendly empty state when the suki has been
 * deleted (or never existed on this device). Includes a single primary
 * CTA to return to the previous screen.
 *
 * Self-contained: wraps its own SafeAreaView so the screen can
 * early-return this component without extra shells.
 */
export function CustomerNotFound({ onBack }: CustomerNotFoundProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <FontAwesome name="user-times" size={64} color="#A89F90" />
        <StyledText
          variant="extrabold"
          className="text-ink-700 text-xl mt-4"
        >
          Customer not found
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-sm mt-2 text-center"
        >
          This suki may have been deleted from another device.
        </StyledText>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mt-6 bg-persimmon-500 rounded-pill px-6 py-3 shadow-persimmon-glow press-scale"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            Go Back
          </StyledText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
