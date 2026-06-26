import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

/**
 * PaymentsEmptyState — onboarding empty state for the Payments tab.
 *
 * Shown only when the customer has zero payments on file (distinct
 * from the "no matches" state in `NoMatchesState`). Invites the
 * cashier to record the first payment when the suki settles up.
 */
export function PaymentsEmptyState() {
  return (
    <View className="items-center justify-center py-12 px-6 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <View className="w-16 h-16 rounded-full bg-paper-100 border border-ink-200 items-center justify-center mb-3">
        <FontAwesome name="money" size={26} color="#4F7A24" />
      </View>
      <StyledText
        variant="extrabold"
        className="text-ink-700 text-lg"
      >
        No payments yet
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mt-1 text-center"
      >
        Record the first payment when the suki settles their balance.
      </StyledText>
    </View>
  );
}
