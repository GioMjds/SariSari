import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { FieldGroup } from './FieldGroup';
import { CustomerFormData } from './useAddCustomerForm';

interface SukiInformationCardProps {
  control: Control<CustomerFormData>;
}

/**
 * SukiInformationCard — Group 1 of the parchment ticket sheet.
 * Customer Name (required, with star) and Phone Number (with phone
 * icon). Two fields separated by a dotted divider, both inside a
 * cream paper card.
 */
export function SukiInformationCard({ control }: SukiInformationCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Suki Information
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Name and contact for this customer
        </StyledText>
      </View>

      {/* Name — required */}
      <Controller
        control={control}
        name="name"
        rules={{ required: 'Customer name is required' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <FieldGroup label="Customer Name" required error={error?.message}>
            <View
              className={`bg-paper-100 rounded-xl border px-3 h-11 flex-row items-center ${
                error
                  ? 'border-semantic-danger'
                  : 'border-ink-100 focus-within:border-persimmon-500'
              }`}
            >
              <FontAwesome name="user" size={14} color="#7A7165" />
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Juan dela Cruz"
                placeholderTextColor="#A89F90"
                accessibilityLabel="Customer name"
                className="flex-1 ml-2 text-ink-900 text-base"
              />
            </View>
          </FieldGroup>
        )}
      />

      <View className="my-3 border-t border-dashed border-ink-200" />

      {/* Phone — optional */}
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <FieldGroup label="Phone Number" helper="Optional — for follow-ups">
            <View className="bg-paper-100 rounded-xl border border-ink-100 px-3 h-11 flex-row items-center focus-within:border-persimmon-500">
              <FontAwesome name="phone" size={14} color="#7A7165" />
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="09XX XXX XXXX"
                placeholderTextColor="#A89F90"
                keyboardType="phone-pad"
                accessibilityLabel="Phone number"
                className="flex-1 ml-2 text-ink-900 text-base"
              />
            </View>
          </FieldGroup>
        )}
      />
    </View>
  );
}