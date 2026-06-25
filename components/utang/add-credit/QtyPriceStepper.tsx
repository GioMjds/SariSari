import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { CreditFormData } from './useAddCreditForm';
import { StyledText } from '@/components/elements';

interface QtyPriceStepperProps {
  /** Current qty string from the form. */
  qty: string;
  /** Min-clamped quantity value (for disabling the minus button). */
  qtyNum: number;
  /** RHF control so this component can render the amount Controller. */
  control: Control<CreditFormData>;
  /** Called when the user taps − or + on the stepper. */
  onBump: (delta: number) => void;
}

/**
 * QtyPriceStepper — the side-by-side quantity stepper and ₱-prefixed
 * unit-price input. The stepper drives the qty field via `onBump`;
 * the unit-price input is wired to the form via a Controller using
 * the `control` prop so the parent hook stays the source of truth.
 */
export function QtyPriceStepper({
  qty,
  qtyNum,
  control,
  onBump,
}: QtyPriceStepperProps) {
  return (
    <View>
      <StyledText variant="black" className="label-caps text-ink-700">
        Quantity &amp; Price
      </StyledText>

      <View className="mt-2 flex-row gap-3">
        {/* Stepper */}
        <View>
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mb-1.5"
          >
            Qty
          </StyledText>
          <View className="flex-row items-center bg-paper-100 rounded-xl border border-ink-100 overflow-hidden">
            <Pressable
              onPress={() => onBump(-1)}
              hitSlop={8}
              disabled={qtyNum <= 1}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              className="press-scale h-11 w-11 items-center justify-center active:bg-paper-200 disabled:opacity-40"
            >
              <FontAwesome name="minus" size={12} color="#28231D" />
            </Pressable>
            <View className="w-12 items-center justify-center border-x border-ink-100 h-11 bg-paper-50">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-base"
              >
                {qty || '1'}
              </StyledText>
            </View>
            <Pressable
              onPress={() => onBump(1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              className="press-scale h-11 w-11 items-center justify-center active:bg-paper-200"
            >
              <FontAwesome name="plus" size={12} color="#28231D" />
            </Pressable>
          </View>
        </View>

        {/* Unit price */}
        <View className="flex-1">
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mb-1.5"
          >
            Unit Price
          </StyledText>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <View className="bg-paper-100 rounded-xl border border-ink-100 flex-row items-center px-3 h-11">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-base"
                >
                  ₱
                </StyledText>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="0.00"
                  placeholderTextColor="#A89F90"
                  keyboardType="decimal-pad"
                  accessibilityLabel="Unit price"
                  className="flex-1 ml-2 text-ink-900 text-base"
                />
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}
