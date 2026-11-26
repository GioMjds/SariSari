import { Control, UseFormSetFocus } from 'react-hook-form';
import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { SukiInformationCard } from './SukiInformationCard';
import { AccountSettingsCard } from './AccountSettingsCard';
import { NotesField } from './NotesField';
import { CustomerFormData } from './useAddCustomerForm';

interface AddCustomerFormSheetProps {
  control: Control<CustomerFormData>;
  setFocus: UseFormSetFocus<CustomerFormData>;
}

interface SubmitButtonProps {
  isPending: boolean;
  onSubmit: () => void;
}

/**
 * SubmitButton — primary CTA. Always pressable (except while saving), so a tap
 * with missing details runs validation and focuses the field to fix.
 */
export function SubmitButton({ isPending, onSubmit }: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onSubmit}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityLabel="Save suki"
      accessibilityState={{ disabled: isPending, busy: isPending }}
      // persimmon-600 keeps the label at 4.5:1; persimmon-500 is only 3.3:1.
      className="rounded-2xl min-h-[52px] flex-row items-center justify-center bg-persimmon-600 active:bg-persimmon-700"
    >
      {isPending ? (
        <ActivityIndicator size="small" color="#FBF7EE" />
      ) : (
        <FontAwesome name="check" size={16} color="#FBF7EE" />
      )}
      <StyledText variant="extrabold" className="text-paper-50 text-base ml-2">
        {isPending ? 'Saving Suki…' : 'Save Suki'}
      </StyledText>
    </Pressable>
  );
}

export function AddCustomerFormSheet({ control, setFocus }: AddCustomerFormSheetProps) {
  return (
    <View className="px-4 pt-1 gap-y-3">
      <SukiInformationCard control={control} setFocus={setFocus} />
      <AccountSettingsCard control={control} setFocus={setFocus} />
      <NotesField control={control} />
    </View>
  );
}
