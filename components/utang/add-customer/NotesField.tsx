import { Control, Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { TextField } from './TextField';
import { CustomerFormData } from './useAddCustomerForm';

interface NotesFieldProps {
  control: Control<CustomerFormData>;
}

const NOTES_MAX = 500;
const QUICK_NOTES = [
  'Pays on payday',
  'Pays every weekend',
  'Lives nearby',
  'Ask before giving utang',
] as const;

/**
 * NotesField — last section of the sheet. A spacious multiline field for
 * private comments, with tap-to-add phrases and a character counter.
 */
export function NotesField({ control }: NotesFieldProps) {
  return (
    <FormSection
      icon="sticky-note-o"
      title="Internal Notes"
      subtitle="Private, only you can see this"
    >
      <Controller
        control={control}
        name="notes"
        render={({ field: { ref, onChange, onBlur, value } }) => {
          const unused = QUICK_NOTES.filter((n) => !value.includes(n));
          const append = (note: string) => {
            const next = value.trim() ? `${value.trimEnd()}\n${note}` : note;
            if (next.length <= NOTES_MAX) onChange(next);
          };

          return (
            <FieldGroup
              label="Notes"
              helper="Reminders about payment habits or preferences"
              aside={`${value.length}/${NOTES_MAX}`}
            >
              {unused.length > 0 ? (
                <View className="flex-row flex-wrap gap-2 mb-2.5">
                  {unused.map((note) => (
                    <Pressable
                      key={note}
                      onPress={() => append(note)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add note: ${note}`}
                      hitSlop={4}
                      className="min-h-[40px] flex-row items-center px-3 rounded-pill border border-dashed border-ink-200 bg-paper-50 active:opacity-70"
                    >
                      <FontAwesome name="plus" size={10} color="#7A7165" />
                      <StyledText variant="medium" className="text-xs text-ink-700 ml-1.5">
                        {note}
                      </StyledText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <TextField
                ref={ref}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Usually buys rice and canned goods on credit"
                multiline
                maxLength={NOTES_MAX}
                textAlignVertical="top"
                accessibilityLabel="Notes, optional"
                className="min-h-[96px]"
              />
            </FieldGroup>
          );
        }}
      />
    </FormSection>
  );
}
