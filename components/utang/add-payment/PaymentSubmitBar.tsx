import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';

interface PaymentSubmitBarProps {
  disabled: boolean;
  isPending: boolean;
  /** Amount the ledger will record, already capped at what is owed. */
  amount: number;
  onPress: () => void;
}

/** Height above the safe area, so the scroll view can pad past the bar. */
export const PAYMENT_SUBMIT_BAR_HEIGHT = 76;

/**
 * PaymentSubmitBar - the one primary action, pinned in thumb reach.
 * The label carries the exact amount so the cashier confirms it before tapping.
 */
export function PaymentSubmitBar({ disabled, isPending, amount, onPress }: PaymentSubmitBarProps) {
  const { t } = useTranslation('utang');
  const label = isPending
    ? t('addPaymentSubmitSaving')
    : amount > 0
      ? t('addPaymentSubmitAmount', { amount: formatPesos(amount) })
      : t('addPaymentSubmitHint');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: isPending }}
      className={`min-h-[56px] rounded-xl flex-row items-center justify-center px-4 bg-persimmon-600 ${
        disabled && !isPending ? 'opacity-40' : 'active:bg-persimmon-700'
      }`}
      style={({ pressed }) => ({ transform: [{ scale: !disabled && pressed ? 0.98 : 1 }] })}
    >
      {isPending ? (
        <ActivityIndicator size="small" color="#FBF7EE" />
      ) : (
        <FontAwesome name="check" size={16} color="#FBF7EE" />
      )}
      <StyledText
        variant="extrabold"
        numberOfLines={1}
        className="text-paper-50 text-base ml-2 flex-shrink-1"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
