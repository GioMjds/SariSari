import { Control, UseFormSetFocus, useWatch } from 'react-hook-form';
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
  control: Control<CustomerFormData>;
  isPending: boolean;
  onSubmit: () => void;
}

/**
 * SubmitButton — primary CTA. It stays pressable while the name is empty
 * (only muted) so a tap runs validation and focuses the name field.
 */
export function SubmitButton({ control, isPending, onSubmit }: SubmitButtonProps) {
  const name = useWatch({ control, name: 'name' });
  const ready = name.trim().length > 0;

  return (
    <Pressable
      onPress={onSubmit}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityLabel="Save suki"
      accessibilityHint={ready ? undefined : 'Enter a customer name first'}
      accessibilityState={{ disabled: isPending, busy: isPending }}
      className={`rounded-2xl min-h-[52px] flex-row items-center justify-center bg-persimmon-500 active:opacity-80 ${
        ready && !isPending ? 'shadow-persimmon-glow' : 'opacity-50'
      }`}
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
