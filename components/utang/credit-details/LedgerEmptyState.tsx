import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { SariMascot, type SariState } from '@/components/mascot';

interface LedgerEmptyStateProps {
  title: string;
  body: string;
  sari?: SariState;
}

// Shared empty and no-match block for both ledger tabs.
export function LedgerEmptyState({
  title,
  body,
  sari = 'empty',
}: LedgerEmptyStateProps) {
  return (
    <View className="items-center py-8 px-6 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <SariMascot state={sari} size={96} defer />
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-base mt-2 text-center"
        accessibilityRole="header"
      >
        {title}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-600 text-sm mt-1 text-center"
      >
        {body}
      </StyledText>
    </View>
  );
}
