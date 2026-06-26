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
  selectedCustomer: Customer | null;
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
 *   3. Customer picker trigger — only rendered when payment is Credit.
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

      {/* Customer picker (credit only) */}
      {paymentType === 'credit' && (
        <Pressable
          onPress={onOpenCustomerPicker}
          accessibilityRole="button"
          accessibilityLabel={
            selectedCustomer
              ? `Change customer. Currently ${selectedCustomer.name}`
              : 'Select customer'
          }
          className={`flex-row items-center justify-between rounded-xl px-3 py-3 mb-3 border ${
            selectedCustomer
              ? 'bg-white border-ink-100'
              : 'bg-semantic-warning-50 border-semantic-warning/30'
          } active:opacity-70`}
        >
          <View className="flex-row items-center flex-1 pr-2">
            <FontAwesome
              name={selectedCustomer ? 'user' : 'exclamation-triangle'}
              size={14}
              color={selectedCustomer ? '#623418' : '#C77B0E'}
            />
            <View className="ml-2 flex-1">
              <StyledText
                variant="medium"
                className="label-caps text-ink-400"
              >
                Suki
              </StyledText>
              <StyledText
                variant={selectedCustomer ? 'extrabold' : 'semibold'}
                className={`text-sm ${
                  selectedCustomer ? 'text-ink-900' : 'text-semantic-warning'
                }`}
                numberOfLines={1}
              >
                {selectedCustomer ? selectedCustomer.name : 'Select customer'}
              </StyledText>
            </View>
          </View>
          <FontAwesome
            name="chevron-right"
            size={12}
            color={selectedCustomer ? '#623418' : '#C77B0E'}
          />
        </Pressable>
      )}

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
