import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Customer } from '@/types';
import { formatPesos } from '@/lib/money';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface CartSummaryTrayProps {
  itemCount: number;
  total: number;
  paymentType: 'cash' | 'credit';
  /**
   * Hybrid buyer identifier:
   *   • `Customer` → registered Suki.
   *   • `string`   → typed one-off name (cash sales only).
   *   • `null`     → no buyer captured.
   */
  selectedCustomer: Customer | string | null;
  isSubmitDisabled: boolean;
  isPending: boolean;
  onPaymentTypeChange: (type: 'cash' | 'credit') => void;
  onOpenCustomerPicker: () => void;
  onSubmit: () => void;
}

/**
 * CartSummaryTray — fixed-bottom panel above the form-sheet edge.
 *
 * Anchors to the bottom of the screen and stacks four blocks:
 *   1. Total items + grand total row.
 *   2. Payment mode toggle (Cash / Credit).
 *   3. Buyer / Suki picker trigger — rendered for BOTH payment modes:
 *        • credit → "Suki (Required)", warning-styled when null.
 *        • cash   → "Buyer / Suki (Optional)", neutral-styled when null.
 *      Tapping opens the hybrid `CustomerPickerModal`.
 *   4. Complete Sale CTA (persimmon, matching `SubmitButton` style).
 *
 * Disabled state uses `bg-ink-100` so the brand fill reads as a
 * muted persimmon rather than fading to a neutral grey.
 */
export function CartSummaryTray({
  itemCount,
  total,
  paymentType,
  selectedCustomer,
  isSubmitDisabled,
  isPending,
  onPaymentTypeChange,
  onOpenCustomerPicker,
  onSubmit,
}: CartSummaryTrayProps) {
  const isCredit = paymentType === 'credit';
  const isRegisteredSuki =
    typeof selectedCustomer === 'object' && selectedCustomer !== null;
  const displayName =
    typeof selectedCustomer === 'string'
      ? selectedCustomer
      : selectedCustomer?.name ?? null;

  // Label + state flags: credit requires a Suki, cash accepts anything.
  const buyerLabel = isCredit ? 'Suki (Required)' : 'Buyer / Suki (Optional)';
  const isRequiredAndMissing = isCredit && !selectedCustomer;

  return (
    <View className="bg-paper-50 border-t border-ink-150 px-4 pt-3 pb-6 shadow-paper-lift">
      {/* Total row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-full bg-paper-100 items-center justify-center mr-2 border border-ink-100">
            <FontAwesome name="shopping-cart" size={14} color="#623418" />
          </View>
          <View>
            <StyledText variant="medium" className="label-caps text-ink-400">
              Items
            </StyledText>
            <StyledText variant="extrabold" className="text-ink-900 text-sm">
              {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
            </StyledText>
          </View>
        </View>
        <View className="items-end">
          <StyledText variant="medium" className="label-caps text-ink-400">
            Total
          </StyledText>
          <MoneyText
            value={total}
            size="lg"
            variant={total > 0 ? 'default' : 'default'}
            className="text-ink-900"
          />
        </View>
      </View>

      {/* Payment toggle */}
      <View className="flex-row gap-2 mb-3">
        <PaymentChip
          label="Cash"
          icon="money"
          active={paymentType === 'cash'}
          onPress={() => onPaymentTypeChange('cash')}
        />
        <PaymentChip
          label="Credit (Utang)"
          icon="book"
          active={paymentType === 'credit'}
          onPress={() => onPaymentTypeChange('credit')}
        />
      </View>

      {/* Hybrid buyer picker — both modes. Warning tone for missing suki on credit,
          neutral tone otherwise. Cash mode shows the buyer as resolved. */}
      <Pressable
        onPress={onOpenCustomerPicker}
        accessibilityRole="button"
        accessibilityLabel={
          displayName
            ? `Change buyer. Currently ${displayName}`
            : isCredit
              ? 'Select customer'
              : 'Add buyer name'
        }
        className={`flex-row items-center justify-between rounded-xl px-3 py-3 mb-3 border ${
          isRequiredAndMissing
            ? 'bg-semantic-warning-50 border-semantic-warning/30'
            : displayName
              ? 'bg-white border-ink-100'
              : 'bg-paper-50 border-ink-200'
        } active:opacity-70`}
      >
        <View className="flex-row items-center flex-1 pr-2">
          <FontAwesome
            name={
              isRequiredAndMissing
                ? 'exclamation-triangle'
                : displayName
                  ? 'user'
                  : 'user-o'
            }
            size={14}
            color={isRequiredAndMissing ? '#C77B0E' : '#623418'}
          />
          <View className="ml-2 flex-1">
            <StyledText
              variant="medium"
              className={`label-caps ${
                isRequiredAndMissing ? 'text-semantic-warning' : 'text-ink-400'
              }`}
            >
              {buyerLabel}
            </StyledText>
            <StyledText
              variant={displayName ? 'extrabold' : 'semibold'}
              className={`text-sm ${
                isRequiredAndMissing
                  ? 'text-semantic-warning'
                  : displayName
                    ? 'text-ink-900'
                    : 'text-ink-500'
              }`}
              numberOfLines={1}
            >
              {displayName ??
                (isCredit ? 'Select customer' : 'Add buyer name (optional)')}
            </StyledText>
          </View>
        </View>

        {/* Small badge indicating whether the selection is a registered Suki
            or a one-off typed name. Helps the owner double-check at the
            counter that they didn't accidentally type a name for a credit
            sale (which would clear the picker on toggle). */}
        {displayName ? (
          <View
            className={`mr-2 px-2 py-0.5 rounded-full border ${
              isRegisteredSuki
                ? 'bg-persimmon-500/10 border-persimmon-500/30'
                : 'bg-ink-100 border-ink-200'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-[10px] label-caps ${
                isRegisteredSuki ? 'text-persimmon-600' : 'text-ink-500'
              }`}
            >
              {isRegisteredSuki ? 'Suki' : 'One-off'}
            </StyledText>
          </View>
        ) : null}

        <FontAwesome
          name="chevron-right"
          size={12}
          color={isRequiredAndMissing ? '#C77B0E' : '#623418'}
        />
      </Pressable>

      {/* Complete Sale CTA */}
      <Pressable
        onPress={onSubmit}
        disabled={isSubmitDisabled}
        accessibilityRole="button"
        accessibilityLabel="Complete sale"
        accessibilityState={{ disabled: isSubmitDisabled, busy: isPending }}
        className={`rounded-2xl py-4 flex-row items-center justify-center ${
          isSubmitDisabled
            ? 'bg-ink-100'
            : 'bg-persimmon-500 shadow-persimmon-glow'
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: !isSubmitDisabled && pressed ? 0.98 : 1 }],
        })}
      >
        <FontAwesome
          name={isPending ? 'spinner' : 'check'}
          size={16}
          color={isSubmitDisabled ? '#7A7165' : '#FBF7EE'}
        />
        <StyledText
          variant="extrabold"
          className={`text-base ml-2 ${
            isSubmitDisabled ? 'text-ink-400' : 'text-paper-50'
          }`}
        >
          {isPending
            ? 'Saving Resibo…'
            : itemCount > 0
            ? `Complete Sale · ${formatPesos(total)}`
            : 'Complete Sale'}
        </StyledText>
      </Pressable>
    </View>
  );
}

interface PaymentChipProps {
  label: string;
  icon: 'money' | 'book';
  active: boolean;
  onPress: () => void;
}

function PaymentChip({ label, icon, active, onPress }: PaymentChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pay with ${label}`}
      accessibilityState={{ selected: active }}
      className={`flex-1 flex-row items-center justify-center rounded-xl py-3 border-2 ${
        active
          ? 'border-secondary bg-secondary-500/10'
          : 'border-ink-100 bg-white'
      } active:opacity-70`}
    >
      <FontAwesome
        name={icon}
        size={14}
        color={active ? '#4F7A24' : '#7A7165'}
      />
      <StyledText
        variant={active ? 'extrabold' : 'medium'}
        className={`ml-2 text-sm ${
          active ? 'text-secondary-600' : 'text-ink-500'
        }`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}