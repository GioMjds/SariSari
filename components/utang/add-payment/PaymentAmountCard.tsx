import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';
import { PaymentFormData, QUICK_PAY_PRESETS } from './useAddPaymentForm';

interface PaymentAmountCardProps {
  control: Control<PaymentFormData>;
  amount: string;
  outstandingBalance: number;
  parsedAmount: number;
  remainingBalance: number;
  willClearAll: boolean;
  /** True once the suki has any outstanding balance (header check). */
  hasOutstanding: boolean;
  onAddAmount: (increment: number) => void;
  /** Paying in full amount */
  onPayFull: () => void;
  /** Paying half of the outstanding balance */
  onHalfPay: () => void;
  /** Clearing the payment amount */
  onClear: () => void;
}

/**
 * PaymentAmountCard — the large peso input, additive quick-pay
 * chips (+₱20/50/100/500), the Pay Full & Half shortcuts, Clear button,
 * and live remaining-balance status pill.
 */
export function PaymentAmountCard({
  control,
  amount,
  outstandingBalance: _outstandingBalance,
  parsedAmount,
  remainingBalance,
  willClearAll,
  hasOutstanding,
  onAddAmount,
  onPayFull,
  onHalfPay,
  onClear,
}: PaymentAmountCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Payment Amount
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Tap chips to add, or type a custom amount
        </StyledText>
      </View>

      {/* Large currency input */}
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <View className="bg-paper-100 rounded-2xl border border-ink-100 flex-row items-center px-4 py-3 focus-within:border-persimmon-500">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-h2 mr-2"
            >
              ₱
            </StyledText>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="0.00"
              placeholderTextColor="#A89F90"
              keyboardType="decimal-pad"
              accessibilityLabel="Payment amount"
              className="flex-1 text-ink-900 text-h2 font-black"
            />
            {value?.length > 0 && (
              <Pressable
                onPress={onClear}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear amount"
                className="press-scale w-8 h-8 items-center justify-center rounded-full bg-paper-200 active:bg-paper-300"
              >
                <FontAwesome name="times" size={14} color="#564E45" />
              </Pressable>
            )}
          </View>
        )}
      />

      {/* Additive quick-pay chips */}
      <View className="mt-3 flex-row gap-2">
        {QUICK_PAY_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onAddAmount(preset)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${formatPesos(preset)}`}
            className="press-scale flex-1 items-center py-2.5 rounded-xl bg-paper-100 border border-ink-100 active:bg-paper-200"
          >
            <StyledText variant="extrabold" className="text-ink-900 text-sm">
              +₱{preset}
            </StyledText>
          </Pressable>
        ))}
      </View>

      {/* Pay Full / Pay Half / Clear preset actions */}
      <View className="mt-2 flex-row gap-2">
        <Pressable
          onPress={onPayFull}
          disabled={!hasOutstanding}
          accessibilityRole="button"
          accessibilityLabel="Pay full outstanding balance"
          className={`press-scale flex-1 items-center justify-center flex-row py-2.5 rounded-xl border ${
            hasOutstanding
              ? 'bg-cinnamon-600 border-cinnamon-600 active:bg-cinnamon-700'
              : 'bg-paper-100 border-ink-100 opacity-50'
          }`}
        >
          <FontAwesome
            name="check-circle"
            size={12}
            color={hasOutstanding ? '#FBF7EE' : '#7A7165'}
          />
          <StyledText
            variant="extrabold"
            className={`text-sm ml-1.5 ${
              hasOutstanding ? 'text-paper-50' : 'text-ink-400'
            }`}
          >
            Pay Full
          </StyledText>
        </Pressable>

        <Pressable
          onPress={onHalfPay}
          disabled={!hasOutstanding}
          accessibilityRole="button"
          accessibilityLabel="Pay half outstanding balance"
          className={`press-scale flex-1 items-center justify-center flex-row py-2.5 rounded-xl border ${
            hasOutstanding
              ? 'bg-amber-700 border-amber-700 active:bg-amber-800'
              : 'bg-paper-100 border-ink-100 opacity-50'
          }`}
        >
          <FontAwesome
            name="adjust"
            size={12}
            color={hasOutstanding ? '#FBF7EE' : '#7A7165'}
          />
          <StyledText
            variant="extrabold"
            className={`text-sm ml-1.5 ${
              hasOutstanding ? 'text-paper-50' : 'text-ink-400'
            }`}
          >
            Pay Half
          </StyledText>
        </Pressable>

        <Pressable
          onPress={onClear}
          disabled={!amount}
          accessibilityRole="button"
          accessibilityLabel="Clear amount"
          className={`press-scale flex-1 items-center justify-center flex-row py-2.5 rounded-xl border ${
            amount
              ? 'bg-paper-100 border-ink-200 active:bg-paper-200'
              : 'bg-paper-100 border-ink-100 opacity-50'
          }`}
        >
          <FontAwesome name="eraser" size={12} color="#564E45" />
          <StyledText variant="extrabold" className="text-ink-700 text-sm ml-1.5">
            Clear
          </StyledText>
        </Pressable>
      </View>

      {/* Remaining balance status card */}
      {amount && parsedAmount > 0 ? (
        <View
          className={`mt-3 rounded-xl p-3 flex-row items-center justify-between border ${
            willClearAll
              ? 'bg-sage-50 border-sage-200'
              : remainingBalance < 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-paper-100 border-ink-100'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <FontAwesome
              name={willClearAll ? 'check-circle' : remainingBalance < 0 ? 'exclamation-circle' : 'info-circle'}
              size={15}
              color={willClearAll ? '#4F7A24' : remainingBalance < 0 ? '#B45309' : '#564E45'}
            />
            <View className="ml-2 flex-1">
              <StyledText
                variant="extrabold"
                className={`text-xs ${
                  willClearAll
                    ? 'text-sage-600'
                    : remainingBalance < 0
                    ? 'text-amber-900'
                    : 'text-ink-700'
                }`}
              >
                {willClearAll
                  ? 'Payment clears total balance'
                  : remainingBalance < 0
                  ? `Overpayment / Change: ${formatPesos(Math.abs(remainingBalance))}`
                  : 'Remaining Balance'}
              </StyledText>
              {!willClearAll && remainingBalance >= 0 && (
                <StyledText variant="extrabold" className="text-ink-900 text-sm mt-0.5">
                  {formatPesos(remainingBalance)}
                </StyledText>
              )}
            </View>
          </View>

          {willClearAll && (
            <View className="bg-sage-500 px-2.5 py-1 rounded-full">
              <StyledText variant="extrabold" className="text-paper-50 text-[10px] uppercase tracking-wider">
                CLEARED
              </StyledText>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

