import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { PaymentFormData } from './useAddPaymentForm';

interface NotesFieldProps {
  control: Control<PaymentFormData>;
}

/**
 * NotesField — multiline notes textarea inside a paper-50 panel.
 * Wraps a Controller so the parent hook owns RHF state.
 */
export function NotesField({ control }: NotesFieldProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Notes
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Optional — context for this payment
        </StyledText>
      </View>

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <View className="bg-paper-100 rounded-xl border border-ink-100 px-3 py-2 focus-within:border-persimmon-500">
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Partial payment for last week's groceries…"
              placeholderTextColor="#A89F90"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Notes"
              className="text-ink-900 text-base min-h-[60px]"
            />
          </View>
        )}
      />
    </View>
  );
}
