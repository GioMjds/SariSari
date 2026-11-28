import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';
import { StyledText } from '@/components/elements';

interface PaymentSubmitBarProps {
  disabled: boolean;
  isPending: boolean;
  /** Amount the ledger will record, already capped at what is owed. */
  amount: number;
  /** No balance to collect, so the label says that instead of asking for an amount. */
  nothingOwed?: boolean;
  onPress: () => void;
}

/** Height above the safe area, so the scroll view can pad past the bar. */
export const PAYMENT_SUBMIT_BAR_HEIGHT = 76;

/**
 * PaymentSubmitBar - the one primary action, pinned in thumb reach.
 * The label carries the exact amount so the cashier confirms it before tapping.
 */
export function PaymentSubmitBar({
  disabled,
  isPending,
  amount,
  nothingOwed = false,
  onPress,
}: PaymentSubmitBarProps) {
  const { t } = useTranslation('utang');
  // Disabled reads as a readable instruction, not a faded brand fill.
  const idle = disabled && !isPending;
  const iconColor = idle ? ICON_COLOR.inkMuted : ICON_COLOR.paper;
  const label = isPending
    ? t('addPaymentSubmitSaving')
    : amount > 0
      ? t('addPaymentSubmitAmount', { amount: formatPesos(amount) })
      : nothingOwed
        ? t('addPaymentNothingTitle')
        : t('addPaymentSubmitHint');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: isPending }}
      className={`min-h-[56px] rounded-xl flex-row items-center justify-center px-4 ${
        idle
          ? 'bg-paper-200 border border-ink-200'
          : 'bg-persimmon-600 active:bg-persimmon-700'
      }`}
      style={({ pressed }) => ({
        transform: [{ scale: !disabled && pressed ? 0.98 : 1 }],
      })}
    >
      {isPending ? (
        <ActivityIndicator size="small" color={ICON_COLOR.paper} />
      ) : (
        <FontAwesome
          name={idle ? 'pencil' : 'check'}
          size={16}
          color={iconColor}
        />
      )}
      <StyledText
        variant="extrabold"
        numberOfLines={1}
        className={`text-base ml-2 flex-shrink-1 ${idle ? 'text-ink-700' : 'text-paper-50'}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
