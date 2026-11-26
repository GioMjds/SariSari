import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface LedgerActionBarProps {
  canCollect: boolean;
  onAddPayment: () => void;
  onAddCredit: () => void;
}

/** Height above the safe area, so the scroll view can pad past the bar. */
export const LEDGER_ACTION_BAR_HEIGHT = 76;

// Pinned to the bottom so both money actions stay in thumb reach on long lists.
export const LedgerActionBar = memo(function LedgerActionBar({
  canCollect,
  onAddPayment,
  onAddCredit,
}: LedgerActionBarProps) {
  const { t } = useTranslation('utang');
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 bottom-0 flex-row gap-2.5 px-4 pt-3 bg-paper-50 border-t border-ink-100"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <Pressable
        onPress={onAddCredit}
        accessibilityRole="button"
        accessibilityLabel={t('detailAddCreditA11y')}
        className="press-scale flex-1 min-h-[52px] rounded-xl bg-paper-50 border border-cinnamon-500 flex-row items-center justify-center"
      >
        <FontAwesome name="plus" size={14} color="#623418" />
        <StyledText variant="extrabold" className="text-cinnamon-700 text-base ml-2">
          {t('detailAddCredit')}
        </StyledText>
      </Pressable>

      <Pressable
        onPress={onAddPayment}
        disabled={!canCollect}
        accessibilityRole="button"
        accessibilityLabel={t('detailAddPaymentA11y')}
        accessibilityHint={canCollect ? undefined : t('detailAddPaymentDisabledHint')}
        accessibilityState={{ disabled: !canCollect }}
        className={`press-scale flex-[1.3] min-h-[52px] rounded-xl flex-row items-center justify-center ${
          canCollect ? 'bg-sage-500' : 'bg-paper-200'
        }`}
      >
        <FontAwesome
          name="money"
          size={15}
          color={canCollect ? '#FBF7EE' : '#7A7165'}
        />
        <StyledText
          variant="extrabold"
          className={`text-base ml-2 ${canCollect ? 'text-paper-50' : 'text-ink-500'}`}
        >
          {t('detailAddPayment')}
        </StyledText>
      </Pressable>
    </View>
  );
});
