import { Control, Controller, UseFormSetFocus } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { tryParsePesosInput } from '@/lib/money';
import { FieldGroup } from './FieldGroup';
import { TextField } from './TextField';
import { CustomerFormData } from './useAddCustomerForm';

interface CreditLimitFieldProps {
  control: Control<CustomerFormData>;
  setFocus: UseFormSetFocus<CustomerFormData>;
}

// Empty string means no limit; values are common sari-sari utang caps.
const PRESETS = [
  { label: 'No limit', value: '' },
  { label: '₱500', value: '500' },
  { label: '₱1,000', value: '1000' },
  { label: '₱2,000', value: '2000' },
  { label: '₱5,000', value: '5000' },
] as const;

const AMOUNT = /^\d+(\.\d{1,2})?$/;

/**
 * CreditLimitField — peso input plus one-tap preset chips for the optional
 * suki credit limit. Empty input is preserved as an empty string;
 * the form hook converts it to `undefined` (DB → NULL) on submit.
 *
 * See AGENTS.md §1: integer-pesos invariant. The raw decimal string
 * here is parsed exactly once, by `useAddCustomerForm.submit`, via
 * `tryParsePesosInput`.
 */
export function CreditLimitField({ control, setFocus }: CreditLimitFieldProps) {
  return (
    <Controller
      control={control}
      name="credit_limit"
      rules={{
        validate: (v) => !v || AMOUNT.test(v) || 'Enter an amount like 1500 or 1500.50',
      }}
      render={({ field: { ref, onChange, onBlur, value }, fieldState: { error } }) => {
        const isValid = !value || AMOUNT.test(value);
        const amount = isValid && value ? tryParsePesosInput(value) : 0;
        // A typed 0 saves as no limit, so the No limit chip stays lit for it.
        const selected = (preset: string) =>
          isValid && amount === (preset === '' ? 0 : Number(preset));

        return (
          <FieldGroup
            label="Credit Limit"
            error={error?.message}
            helper={amount > 0 ? 'Utang stops at this amount' : 'No cap, they can borrow any amount'}
          >
            <View
              className="flex-row flex-wrap gap-2 mb-2.5"
              accessibilityRole="radiogroup"
              accessibilityLabel="Credit limit presets"
            >
              {PRESETS.map((p) => {
                const isOn = selected(p.value);
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onChange(p.value);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isOn }}
                    hitSlop={4}
                    className={`min-h-[40px] px-3.5 rounded-pill border items-center justify-center active:opacity-70 ${
                      isOn
                        ? 'bg-cinnamon-500 border-cinnamon-500'
                        : 'bg-paper-100 border-ink-100'
                    }`}
                  >
                    <StyledText
                      variant="semibold"
                      className={`text-sm ${isOn ? 'text-paper-50' : 'text-ink-700'}`}
                    >
                      {p.label}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>
            <StyledText variant="medium" className="text-caption text-ink-700 mb-1.5">
              Or type your own amount
            </StyledText>
            <TextField
              ref={ref}
              icon="money"
              prefix="₱"
              error={error?.message}
              value={value}
              onChangeText={(t) => onChange(t.replace(/[^\d.]/g, ''))}
              onBlur={onBlur}
              placeholder="e.g. 1500"
              keyboardType="decimal-pad"
              maxLength={10}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('address')}
              accessibilityLabel="Credit limit in pesos, optional"
            />
          </FieldGroup>
        );
      }}
    />
  );
}
