import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { AccessibilityInfo, Pressable, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui';
import { PaymentFormData, QUICK_PAY_PRESETS } from './useAddPaymentForm';

interface PaymentAmountCardProps {
  control: Control<PaymentFormData>;
  /** Most this payment can record: the pinned credit or the whole balance. */
  owed: number;
  recordedAmount: number;
  change: number;
  remainingBalance: number;
  willClearAll: boolean;
  quickSettle: boolean;
  onAddAmount: (increment: number) => void;
  onPayFull: () => void;
  onHalfPay: () => void;
  onClear: () => void;
}

/**
 * PaymentAmountCard - labelled peso input, one row of shortcut chips,
 * and a live line that says what the balance becomes after this payment.
 */
export function PaymentAmountCard({
  control,
  owed,
  recordedAmount,
  change,
  remainingBalance,
  willClearAll,
  quickSettle,
  onAddAmount,
  onPayFull,
  onHalfPay,
  onClear,
}: PaymentAmountCardProps) {
  const { t } = useTranslation('utang');
  const [focused, setFocused] = useState(false);
  const half = Math.floor(owed / 2);
  const itemPaid = quickSettle && recordedAmount > 0 && recordedAmount >= owed;
  const newBalance = formatPesos(Math.max(0, remainingBalance));

  // One spoken summary after typing pauses; live regions repeat on Android and are silent on iOS.
  const announcement =
    recordedAmount <= 0
      ? ''
      : [
          willClearAll
            ? t('addPaymentA11yCleared', { amount: newBalance })
            : t('addPaymentA11yPartial', { amount: newBalance }),
          change > 0
            ? t('addPaymentA11yChange', { change: formatPesos(change) })
            : null,
        ]
          .filter(Boolean)
          .join('. ');
  useEffect(() => {
    if (!announcement) return;
    const id = setTimeout(
      () => AccessibilityInfo.announceForAccessibility(announcement),
      900,
    );
    return () => clearTimeout(id);
  }, [announcement]);

  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4">
      <StyledText
        variant="semibold"
        nativeID="payment-amount-label"
        className="text-ink-700 text-sm mb-2"
      >
        {t('addPaymentAmountLabel')}
      </StyledText>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <View
            className={`rounded-xl border-2 flex-row items-center px-4 min-h-[68px] bg-paper-100 ${
              focused ? 'border-persimmon-500' : 'border-ink-100'
            }`}
          >
            <StyledText
              variant="extrabold"
              maxFontSizeMultiplier={1.4}
              className="text-ink-500 mr-1"
              style={{ fontSize: 28 }}
            >
              ₱
            </StyledText>
            <TextInput
              value={value}
              onChangeText={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0.00"
              placeholderTextColor={ICON_COLOR.inkFaint}
              keyboardType="decimal-pad"
              // Caps growth so a full amount still fits a 360 dp phone at large text sizes.
              maxFontSizeMultiplier={1.4}
              accessibilityLabel={t('addPaymentAmountA11y')}
              accessibilityLabelledBy="payment-amount-label"
              className="flex-1 text-ink-900 py-2"
              style={{
                fontSize: 34,
                fontFamily: 'StackSansText-Bold',
                fontVariant: ['tabular-nums'],
              }}
            />
            {value?.length > 0 && (
              <Pressable
                onPress={onClear}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('addPaymentClearA11y')}
                className="press-scale w-9 h-9 items-center justify-center rounded-full bg-paper-200 active:bg-paper-300"
              >
                <FontAwesome
                  name="times"
                  size={14}
                  color={ICON_COLOR.inkMuted}
                />
              </Pressable>
            )}
          </View>
        )}
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        {owed > 0 && (
          <>
            <Chip
              label={t('addPaymentChipFull', { amount: formatPesos(owed) })}
              a11y={t('addPaymentChipFullA11y', { amount: formatPesos(owed) })}
              tone="sage"
              onPress={onPayFull}
            />
            {half > 0 && (
              <Chip
                label={t('addPaymentChipHalf', { amount: formatPesos(half) })}
                a11y={t('addPaymentChipHalfA11y', {
                  amount: formatPesos(half),
                })}
                onPress={onHalfPay}
              />
            )}
          </>
        )}
        {QUICK_PAY_PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={`+₱${preset}`}
            a11y={t('addPaymentChipAddA11y', { amount: formatPesos(preset) })}
            onPress={() => onAddAmount(preset)}
          />
        ))}
      </View>

      {/* Fixed min height so the card never jumps as the result changes. */}
      <View className="mt-3 pt-3 border-t border-dashed border-ink-200 min-h-[56px] justify-center">
        <MotiView
          key={
            recordedAmount > 0
              ? `r-${willClearAll || itemPaid}-${change > 0}`
              : 'empty'
          }
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 150 }}
        >
          {recordedAmount <= 0 ? (
            <StyledText variant="regular" className="text-ink-600 text-sm">
              {t('addPaymentHelper')}
            </StyledText>
          ) : (
            <>
              <View className="flex-row items-center justify-between">
                <StyledText variant="semibold" className="text-ink-700 text-sm">
                  {t('addPaymentNewBalance')}
                </StyledText>
                <View className="flex-row items-center gap-2">
                  {(willClearAll || itemPaid) && (
                    <StatusPill variant="success" size="sm" dot>
                      {willClearAll
                        ? t('addPaymentFullyPaid')
                        : t('addPaymentItemPaid')}
                    </StatusPill>
                  )}
                  <StyledText
                    variant="extrabold"
                    className={`text-base ${willClearAll ? 'text-sage-700' : 'text-ink-900'}`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {newBalance}
                  </StyledText>
                </View>
              </View>
              {change > 0 && (
                <View className="mt-1.5 flex-row items-center">
                  <FontAwesome
                    name="exchange"
                    size={12}
                    color={ICON_COLOR.warningStrong}
                  />
                  <StyledText
                    variant="semibold"
                    className="text-semantic-warning-700 text-sm ml-1.5 flex-1"
                  >
                    {t('addPaymentChange', {
                      recorded: formatPesos(recordedAmount),
                      change: formatPesos(change),
                    })}
                  </StyledText>
                </View>
              )}
            </>
          )}
        </MotiView>
      </View>
    </View>
  );
}

function Chip({
  label,
  a11y,
  tone,
  onPress,
}: {
  label: string;
  a11y: string;
  tone?: 'sage';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      className={`press-scale min-h-[48px] px-3.5 rounded-xl border items-center justify-center ${
        tone === 'sage'
          ? 'bg-sage-50 border-sage-500 active:bg-sage-100'
          : 'bg-paper-100 border-ink-200 active:bg-paper-200'
      }`}
    >
      <StyledText
        variant="extrabold"
        className={`text-sm ${tone === 'sage' ? 'text-sage-700' : 'text-ink-900'}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
