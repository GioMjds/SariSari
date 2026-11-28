import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { ICON_COLOR } from '@/lib/theme';
import { PaymentFormData } from './useAddPaymentForm';

interface NotesFieldProps {
  control: Control<PaymentFormData>;
}

/** NotesField - hidden behind an "Add a note" link so the form stays short at rest. */
export function NotesField({ control }: NotesFieldProps) {
  const { t } = useTranslation('utang');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        className="press-scale self-start flex-row items-center min-h-[44px] px-1"
      >
        <FontAwesome name="plus" size={12} color={ICON_COLOR.persimmonStrong} />
        <StyledText
          variant="extrabold"
          className="text-persimmon-700 text-sm ml-2"
        >
          {t('addPaymentAddNote')}
        </StyledText>
      </Pressable>
    );
  }

  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4">
      <StyledText
        variant="semibold"
        nativeID="payment-note-label"
        className="text-ink-700 text-sm mb-2"
      >
        {t('addPaymentNoteLabel')}
      </StyledText>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            autoFocus
            placeholder={t('addPaymentNotePlaceholder')}
            placeholderTextColor={ICON_COLOR.inkFaint}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel={t('addPaymentNoteLabel')}
            accessibilityLabelledBy="payment-note-label"
            className="bg-paper-100 rounded-xl border border-ink-100 px-3 py-2.5 text-ink-900 text-base min-h-[80px]"
          />
        )}
      />
    </View>
  );
}
