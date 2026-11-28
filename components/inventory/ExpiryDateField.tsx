import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  EXPIRY_QUICK_PICKS,
  expiryFromToday,
  formatExpiryInput,
  isValidIsoDate,
} from '@/lib/expiry';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

/** Optional expiry date: type YYYYMMDD or tap a quick pick counted from today. */
export function ExpiryDateField({ value, onChange }: Props) {
  const { t } = useTranslation('inventory');
  const invalid = value !== '' && !isValidIsoDate(value);

  return (
    <View>
      <StyledText variant="regular" className="text-ink-500 text-xs mb-1">
        {t('expiryDateLabel')}
      </StyledText>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(formatExpiryInput(v))}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#A89F90"
        accessibilityLabel={t('expiryDateLabel')}
        className={`bg-paper-100 border rounded-xl px-3 py-2.5 text-ink-900 text-sm font-stack-sans ${
          invalid ? 'border-semantic-danger' : 'border-ink-200'
        }`}
      />
      {invalid ? (
        <StyledText
          variant="medium"
          className="text-semantic-danger text-xs mt-1.5 px-1"
          accessibilityRole="alert"
        >
          {t('expiryDateInvalid')}
        </StyledText>
      ) : null}
      <View className="mt-2 flex-row flex-wrap gap-2">
        {EXPIRY_QUICK_PICKS.map((pick) => (
          <Pressable
            key={pick.label}
            accessibilityRole="button"
            accessibilityLabel={`${t('expiryDateLabel')}: ${pick.label}`}
            onPress={() => onChange(expiryFromToday(pick.days))}
            className="px-3 py-1.5 rounded-full border border-ink-200 bg-paper-50 active:bg-paper-100"
          >
            <StyledText variant="semibold" className="text-xs text-ink-700">
              {pick.label}
            </StyledText>
          </Pressable>
        ))}
        {value !== '' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expiryDateClear')}
            onPress={() => onChange('')}
            className="px-3 py-1.5 rounded-full border border-ink-200 bg-paper-50 active:bg-paper-100"
          >
            <StyledText variant="semibold" className="text-xs text-ink-700">
              {t('expiryDateClear')}
            </StyledText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
