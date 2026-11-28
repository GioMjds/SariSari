import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui/Sheet';
import { addDaysIso } from '@/lib/dueDates';
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

const toDate = (iso: string): Date => {
  if (!isValidIsoDate(iso)) return new Date();
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

/** Optional expiry date: pick from a calendar, type YYYYMMDD, or tap a quick pick counted from today. */
export function ExpiryDateField({ value, onChange }: Props) {
  const { t } = useTranslation('inventory');
  const invalid = value !== '' && !isValidIsoDate(value);
  // iOS shows the calendar in a sheet; Android opens its native dialog.
  const [iosOpen, setIosOpen] = useState(false);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(addDaysIso(0, date.getTime()));
        },
      });
    } else {
      setIosOpen(true);
    }
  };

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('expiryDatePick')}
          onPress={openPicker}
          className="px-3 py-1.5 rounded-full border border-cinnamon-500 bg-cinnamon-500 flex-row items-center gap-1.5 active:opacity-80"
        >
          <FontAwesome name="calendar" size={12} color="#FBF7EE" />
          <StyledText variant="semibold" className="text-xs text-paper-50">
            {t('expiryDatePick')}
          </StyledText>
        </Pressable>
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
      <Sheet visible={iosOpen} onClose={() => setIosOpen(false)}>
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display="inline"
          onChange={(_event, date) => {
            if (date) onChange(addDaysIso(0, date.getTime()));
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('expiryDateDone')}
          onPress={() => setIosOpen(false)}
          className="min-h-[48px] rounded-xl items-center justify-center bg-cinnamon-500 active:opacity-80"
        >
          <StyledText variant="extrabold" className="text-base text-paper-50">
            {t('expiryDateDone')}
          </StyledText>
        </Pressable>
      </Sheet>
    </View>
  );
}
