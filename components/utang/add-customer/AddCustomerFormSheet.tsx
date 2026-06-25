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

/**
 * SubmitButton — the persimmon primary action. Disabled state uses
 * the brand fill at 40% opacity to keep the call-to-action read as
 * persimmon rather than fading to a neutral grey.
 */
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
          ? 'bg-persimmon-500 opacity-40'
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

/**
 * AddCustomerFormSheet — composes the three parchment field cards
 * (Suki Information, Account Settings, Internal Notes) separated by
 * dashed dividers, plus the persimmon SubmitButton. The ticket
 * sheet lives inside the page-level `KeyboardAwareScrollView` on
 * the route file.
 *
 * Pure presentation; values and handlers come from the route via
 * `useAddCustomerForm`.
 */
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