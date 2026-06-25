import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { FieldGroup } from './FieldGroup';
import { CustomerFormData } from './useAddCustomerForm';

interface NotesFieldProps {
  control: Control<CustomerFormData>;
}

/**
 * NotesField — Group 3 of the parchment ticket sheet. A spacious
 * multiline field for private comments on this suki.
 */
export function NotesField({ control }: NotesFieldProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Internal Notes
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Private — only you can see this
        </StyledText>
      </View>

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <FieldGroup label="Notes" helper="Optional — reminders about this suki">
            <View className="bg-paper-100 rounded-xl border border-ink-100 px-3 py-2 focus-within:border-persimmon-500">
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Prefers to settle on payday…"
                placeholderTextColor="#A89F90"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Notes"
                className="text-ink-900 text-base min-h-[80px]"
              />
            </View>
          </FieldGroup>
        )}
      />
    </View>
  );
}