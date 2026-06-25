import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { CreditFormData } from './useAddCreditForm';
import { StyledText } from '@/components/elements';

interface NotesFieldProps {
  control: Control<CreditFormData>;
}

/**
 * NotesField — multiline notes textarea inside a paper-100 panel.
 * Wraps a Controller so the parent hook owns RHF state.
 */
export function NotesField({ control }: NotesFieldProps) {
  return (
    <View>
      <StyledText variant="black" className="label-caps text-ink-700">
        Notes
      </StyledText>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <View className="mt-2 bg-paper-100 rounded-xl border border-ink-100 px-3 py-2">
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Suki's note for this slip…"
              placeholderTextColor="#A89F90"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              accessibilityLabel="Notes"
              className="text-ink-900 text-sm min-h-[36px]"
            />
          </View>
        )}
      />
    </View>
  );
}
