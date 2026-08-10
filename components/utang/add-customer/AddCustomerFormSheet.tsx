import { Control } from 'react-hook-form';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { SukiInformationCard } from './SukiInformationCard';
import { AccountSettingsCard } from './AccountSettingsCard';
import { NotesField } from './NotesField';
import { CustomerFormData } from './useAddCustomerForm';

interface AddCustomerFormSheetProps {
  control: Control<CustomerFormData>;
  isPending: boolean;
  onSubmit: () => void;
}

export function SubmitButton({
  isPending,
  onSubmit,
}: Pick<AddCustomerFormSheetProps, 'isPending' | 'onSubmit'>) {
  return (
    <Pressable
      onPress={onSubmit}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityLabel="Add customer to suki list"
      accessibilityState={{ disabled: isPending, busy: isPending }}
      className={`press-scale rounded-2xl py-4 flex-row items-center justify-center mt-5 ${
        isPending
          ? 'bg-persimmon-500 opacity-40 shadow-none'
          : 'bg-persimmon-500 shadow-persimmon-glow'
      }`}
    >
      <FontAwesome
        name={isPending ? 'spinner' : 'check'}
        size={16}
        color="#FBF7EE"
      />
      <StyledText variant="extrabold" className="text-paper-50 text-base ml-2">
        {isPending ? 'Saving Suki…' : 'Add Suki'}
      </StyledText>
    </Pressable>
  );
}

export function AddCustomerFormSheet({
  control,
  isPending,
  onSubmit,
}: AddCustomerFormSheetProps) {
  return (
    <View className="px-4 pt-4">
      <SukiInformationCard control={control} />

      <View className="my-3 border-t border-dashed border-ink-300" />

      <AccountSettingsCard control={control} />

      <View className="my-3 border-t border-dashed border-ink-300" />

      <NotesField control={control} />

      <SubmitButton isPending={isPending} onSubmit={onSubmit} />
    </View>
  );
}
