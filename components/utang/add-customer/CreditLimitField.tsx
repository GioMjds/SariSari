import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { CustomerFormData } from './useAddCustomerForm';

interface CreditLimitFieldProps {
  control: Control<CustomerFormData>;
}

/**
 * CreditLimitField — peso-prefixed decimal input for the optional
 * suki credit limit. Empty input is preserved as an empty string;
 * the form hook converts it to `undefined` (DB → NULL) on submit.
 *
 * See AGENTS.md §1: integer-pesos invariant. The raw decimal string
 * here is parsed exactly once, by `useAddCustomerForm.submit`, via
 * `tryParsePesosInput`.
 */
export function CreditLimitField({ control }: CreditLimitFieldProps) {
  return (
    <Controller
      control={control}
      name="credit_limit"
      render={({ field: { onChange, value } }) => (
        <View className="bg-paper-100 rounded-xl border border-ink-100 flex-row items-center px-3 h-11 focus-within:border-persimmon-500">
          <FontAwesome name="money" size={14} color="#7A7165" />
          <StyledText variant="extrabold" className="text-ink-900 text-base ml-2">
            ₱
          </StyledText>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="0.00"
            placeholderTextColor="#A89F90"
            keyboardType="decimal-pad"
            accessibilityLabel="Credit limit"
            className="flex-1 ml-2 text-ink-900 text-base"
          />
        </View>
      )}
    />
  );
}