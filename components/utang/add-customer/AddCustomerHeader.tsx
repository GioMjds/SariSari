import { memo } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Control, useWatch } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos, tryParsePesosInput } from '@/lib/money';
import { formatPhone } from './phone';
import { CustomerFormData } from './useAddCustomerForm';

interface AddCustomerHeaderProps {
  control: Control<CustomerFormData>;
  onBack: () => void;
}

/** Top bar with back button; never re-renders while typing. */
export const AddCustomerHeader = memo(function AddCustomerHeader({
  control,
  onBack,
}: AddCustomerHeaderProps) {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-11 h-11 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <StyledText
          variant="extrabold"
          className="text-ink-900 text-h2"
          accessibilityRole="header"
        >
          New Suki
        </StyledText>

        <View className="w-11 h-11" />
      </View>

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
