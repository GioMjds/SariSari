import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

interface ReceiptsErrorStateProps {
  onRetry: () => void;
}

// Shown when receipts fail to load, so a read error never looks like an empty ledger.
export function ReceiptsErrorState({ onRetry }: ReceiptsErrorStateProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="mx-4 mt-6 items-center rounded-card border border-ink-100 bg-paper-50 px-6 py-8"
    >
      <SariMascot state="error" size={110} style={{ marginBottom: 8 }} />
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-900 text-lg text-center"
      >
        Hindi ma-load ang mga resibo
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-600 text-sm text-center mt-1.5"
      >
        Something went wrong reading the ledger. Try again, and restart the app
        if it keeps happening.
      </StyledText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        accessibilityHint="Reloads your receipts"
        className="mt-5 min-h-12 px-7 rounded-pill bg-persimmon-600 active:bg-persimmon-700 items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          Try again
        </StyledText>
      </Pressable>
    </View>
  );
}
