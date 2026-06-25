import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { FieldGroup } from './FieldGroup';
import { CreditLimitField } from './CreditLimitField';
import { CustomerFormData } from './useAddCustomerForm';

interface AccountSettingsCardProps {
  control: Control<CustomerFormData>;
}

/**
 * AccountSettingsCard — Group 2 of the parchment ticket sheet.
 * Credit Limit (peso input, optional) and Address (map-marker icon,
 * optional, multiline).
 */
export function AccountSettingsCard({ control }: AccountSettingsCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Account Settings
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Borrowing cap and pickup location
        </StyledText>
      </View>

      <FieldGroup
        label="Credit Limit"
        helper="Leave blank for open-ended borrowing"
      >
        <CreditLimitField control={control} />
      </FieldGroup>

      <View className="my-3 border-t border-dashed border-ink-200" />

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, value } }) => (
          <FieldGroup label="Address" helper="Optional — where to find them">
            <View className="bg-paper-100 rounded-xl border border-ink-100 px-3 py-2 flex-row items-start focus-within:border-persimmon-500">
              <FontAwesome
                name="map-marker"
                size={14}
                color="#7A7165"
                className="mt-2.5"
              />
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Street, barangay, town"
                placeholderTextColor="#A89F90"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                accessibilityLabel="Address"
                className="flex-1 ml-2 text-ink-900 text-base min-h-[36px]"
              />
            </View>
          </FieldGroup>
        )}
      />
    </View>
  );
}