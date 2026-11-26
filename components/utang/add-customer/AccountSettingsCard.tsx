import { Control, Controller, UseFormSetFocus } from 'react-hook-form';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { TextField } from './TextField';
import { CreditLimitField } from './CreditLimitField';
import { CustomerFormData } from './useAddCustomerForm';

interface AccountSettingsCardProps {
  control: Control<CustomerFormData>;
  setFocus: UseFormSetFocus<CustomerFormData>;
}

/**
 * AccountSettingsCard — second section of the sheet. Credit Limit (presets or
 * custom peso input) and Address (optional, wraps to a second line).
 */
export function AccountSettingsCard({ control, setFocus }: AccountSettingsCardProps) {
  return (
    <FormSection
      icon="credit-card"
      title="Account Settings"
      subtitle="Borrowing cap and where to find them"
    >
      <CreditLimitField control={control} setFocus={setFocus} />

      <Controller
        control={control}
        name="address"
        render={({ field: { ref, onChange, onBlur, value } }) => (
          <FieldGroup label="Address" helper="Street, purok, or a landmark works">
            <TextField
              ref={ref}
              icon="map-marker"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. Purok 3, near the chapel"
              autoCapitalize="words"
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              multiline
              maxLength={160}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('notes')}
              accessibilityLabel="Address, optional"
              className="min-h-[32px]"
            />
          </FieldGroup>
        )}
      />
    </FormSection>
  );
}
