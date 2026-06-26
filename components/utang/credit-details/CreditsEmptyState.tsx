import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

/**
 * CreditsEmptyState — onboarding empty state for the Credits tab.
 *
 * Shown only when the customer has zero credits on file (distinct from
 * the "no matches" state, which lives in `NoMatchesState`). Invites
 * the cashier to log the first credit transaction for this suki.
 */
export function CreditsEmptyState() {
  return (
    <View className="items-center justify-center py-12 px-6 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <View className="w-16 h-16 rounded-full bg-paper-100 border border-ink-200 items-center justify-center mb-3">
        <FontAwesome name="credit-card" size={26} color="#7A1CAC" />
      </View>
      <StyledText
        variant="extrabold"
        className="text-ink-700 text-lg"
      >
        No credits yet
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mt-1 text-center"
      >
        Add the first credit transaction to start tracking this suki&apos;s ledger.
      </StyledText>
    </View>
  );
}
