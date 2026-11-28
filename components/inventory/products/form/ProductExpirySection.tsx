import { TextInput } from 'react-native';
import { type Control, useController } from 'react-hook-form';
import { ExpiryDateField } from '@/components/inventory/ExpiryDateField';
import { StyledText } from '@/components/elements';
import { SectionCard, inputClass, INPUT_TEXT_CLASS, PLACEHOLDER_COLOR } from './FormPrimitives';
import type { ProductFormData } from './types';

/** Optional earliest expiry date and a per-product warning window that overrides the store setting. */
export function ProductExpirySection({ control }: { control: Control<ProductFormData> }) {
  const expiry = useController({ control, name: 'expiryDate' });
  const warn = useController({ control, name: 'expiryWarnDays' });

  return (
    <SectionCard
      title="Expiry"
      hint="Optional. Use the earliest date of the stock on the shelf."
    >
      <ExpiryDateField value={expiry.field.value} onChange={expiry.field.onChange} />
      <StyledText variant="regular" className="text-ink-500 text-xs -mb-2">
        Warn this many days before expiry (blank uses the store setting)
      </StyledText>
      <TextInput
        value={warn.field.value}
        onChangeText={(v) => warn.field.onChange(v.replace(/\D/g, '').slice(0, 3))}
        keyboardType="number-pad"
        placeholder="Store default"
        placeholderTextColor={PLACEHOLDER_COLOR}
        accessibilityLabel="Warn days before expiry"
        className={`${inputClass()} ${INPUT_TEXT_CLASS}`}
      />
    </SectionCard>
  );
}
