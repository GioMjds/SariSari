import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

interface LedgerEmptyStateProps {
  onLogTransaction: () => void;
}

// Sits under the hero when a product has no entries in the last 30 days.
export function LedgerEmptyState({ onLogTransaction }: LedgerEmptyStateProps) {
  const { t } = useTranslation('inventory');
  return (
    <View className="mx-4 mt-5 items-center px-6 py-8 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <SariMascot state="inventory" size={112} style={{ marginBottom: 12 }} />
      <StyledText variant="extrabold" className="text-ink-900 text-lg text-center">
        {t('ledgerEmptyTitle')}
      </StyledText>
      <StyledText variant="regular" className="text-ink-600 text-sm text-center mt-1 leading-5">
        {t('ledgerEmptyBody')}
      </StyledText>
      <Pressable
        onPress={onLogTransaction}
        accessibilityRole="button"
        accessibilityLabel={t('ledgerLogChange')}
        className="press-scale mt-5 min-h-[48px] px-5 rounded-xl bg-persimmon-500 active:bg-persimmon-700 flex-row items-center justify-center"
      >
        <FontAwesome name="plus" size={14} color="#FAFAF7" />
        <StyledText variant="extrabold" className="text-paper-50 text-sm ml-2">
          {t('ledgerLogChange')}
        </StyledText>
      </Pressable>
    </View>
  );
}
