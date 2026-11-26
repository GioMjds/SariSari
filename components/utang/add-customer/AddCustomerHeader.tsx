import { memo } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos, tryParsePesosInput } from '@/lib/money';
import { formatPhone } from './phone';
import { CustomerFormData } from './useAddCustomerForm';

interface AddCustomerHeaderProps {
  control: Control<CustomerFormData>;
}

/** Preview card above the form; the top bar is the shared ProductFormHeader. */
export const AddCustomerHeader = memo(function AddCustomerHeader({
  control,
}: AddCustomerHeaderProps) {
  return (
    <View className="px-4 pt-4 pb-3">
      <PassbookPreview control={control} />
    </View>
  );
});

/**
 * PassbookPreview — dark cinnamon member card that mirrors the form live.
 * It alone subscribes to the watched fields, so typing repaints only this card.
 */
function PassbookPreview({ control }: Pick<AddCustomerHeaderProps, 'control'>) {
  const [name, phone, creditLimit] = useWatch({
    control,
    name: ['name', 'phone', 'credit_limit'],
  });
  const trimmedName = name.trim();
  const limit = creditLimit ? tryParsePesosInput(creditLimit) : 0;

  return (
    <View
      className="bg-cinnamon-500 rounded-2xl px-5 py-4 overflow-hidden relative"
      accessible
      accessibilityLabel={`Preview: ${trimmedName || 'no name yet'}, phone ${
        phone ? formatPhone(phone) : 'none'
      }, credit limit ${limit > 0 ? formatPesos(limit) : 'none'}`}
    >
      {/* Decorative peso watermark */}
      <StyledText
        variant="black"
        className="absolute -right-2 -top-3 text-paper-100 opacity-10 leading-none"
        style={{ fontSize: 120 }}
      >
        ₱
      </StyledText>

      <StyledText
        variant="extrabold"
        className={`text-h3 relative ${trimmedName ? 'text-paper-50' : 'text-paper-200 opacity-60'}`}
        numberOfLines={1}
      >
        {trimmedName || 'Suki Name'}
      </StyledText>

      <View className="flex-row items-end justify-between mt-3 relative">
        <View className="flex-1 pr-3">
          <StyledText variant="medium" className="text-caption text-paper-200">
            Phone
          </StyledText>
          <StyledText
            variant="semibold"
            className={`text-sm mt-0.5 ${phone ? 'text-paper-50' : 'text-paper-200 opacity-60'}`}
            numberOfLines={1}
          >
            {phone ? formatPhone(phone) : '—'}
          </StyledText>
        </View>

        <View className="items-end">
          <StyledText variant="medium" className="text-caption text-paper-200">
            Credit limit
          </StyledText>
          <StyledText
            variant="extrabold"
            className={`text-base mt-0.5 ${limit > 0 ? 'text-paper-50' : 'text-persimmon-300'}`}
          >
            {limit > 0 ? formatPesos(limit) : 'No Limit'}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
