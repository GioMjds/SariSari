import { Control, Controller, UseFormSetFocus } from 'react-hook-form';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { TextField } from './TextField';
import { formatPhone, normalizePhoneInput, validatePhone } from './phone';
import { CustomerFormData } from './useAddCustomerForm';

interface SukiInformationCardProps {
  control: Control<CustomerFormData>;
  setFocus: UseFormSetFocus<CustomerFormData>;
}

/**
 * SukiInformationCard — step 1 of the sheet. Customer Name (required,
 * trimmed) and Phone Number (digits stored, PH mobile grouping shown).
 */
export function SukiInformationCard({ control, setFocus }: SukiInformationCardProps) {
  return (
    <FormSection
      step={1}
      icon="user"
      title="Suki Information"
      subtitle="Who they are and how to reach them"
    >
      <Controller
        control={control}
        name="name"
        rules={{
          validate: (v) => v.trim().length > 0 || 'Enter the customer name to continue',
        }}
        render={({ field: { ref, onChange, onBlur, value }, fieldState: { error } }) => (
          <FieldGroup
            label="Customer Name"
            required
            error={error?.message}
            helper="Use the name you call them in the store"
          >
            <TextField
              ref={ref}
              icon="user"
              invalid={!!error}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. Aling Nena"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              autoCorrect={false}
              maxLength={60}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('phone')}
              accessibilityLabel="Customer name, required"
            />
          </FieldGroup>
        )}
      />

      <Controller
        control={control}
        name="phone"
        rules={{ validate: validatePhone }}
        render={({ field: { ref, onChange, onBlur, value }, fieldState: { error } }) => (
          <FieldGroup
            label="Phone Number"
            error={error?.message}
            helper="For payment reminders by call or text"
          >
            <TextField
              ref={ref}
              icon="phone"
              invalid={!!error}
              value={formatPhone(value)}
              onChangeText={(t) => onChange(normalizePhoneInput(t))}
              onBlur={onBlur}
              placeholder="0917 123 4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('credit_limit')}
              accessibilityLabel="Phone number, optional"
            />
          </FieldGroup>
        )}
      />
    </FormSection>
  );
}
