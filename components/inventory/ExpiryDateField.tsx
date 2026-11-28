import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  DatePickerSheet,
  type DateDescription,
} from '@/components/ui/DatePickerSheet';
import { useNearExpiryDays } from '@/hooks/useAppSetting';
import { addDaysIso } from '@/lib/dueDates';
import {
  EXPIRY_QUICK_PICKS,
  daysUntilExpiry,
  expiryFromToday,
  formatExpiryInput,
  isValidIsoDate,
} from '@/lib/expiry';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

/** Optional expiry date: open the calendar, type YYYYMMDD, or tap a quick pick counted from today. */
export function ExpiryDateField({ value, onChange }: Props) {
  const { t } = useTranslation('inventory');
  const windowDays = useNearExpiryDays();
  const [pickerOpen, setPickerOpen] = useState(false);
  const invalid = value !== '' && !isValidIsoDate(value);

  const describe = (iso: string): DateDescription | null => {
    const days = daysUntilExpiry(iso);
    if (days === null) return null;
    if (days < 0) {
      return { tone: 'danger', text: t('expiryStatusExpired', { count: -days }) };
    }
    if (days === 0) return { tone: 'danger', text: t('expiryStatusToday') };
    return {
      tone: days <= windowDays ? 'warning' : 'ok',
      text: t('expiryStatusLeft', { count: days }),
    };
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
          onPress={() => setPickerOpen(true)}
          className="min-h-[44px] px-4 rounded-full bg-cinnamon-500 flex-row items-center justify-center gap-1.5 active:opacity-80"
        >
          <FontAwesome name="calendar" size={13} color="#FBF7EE" />
          <StyledText variant="semibold" className="text-sm text-paper-50">
            {t('expiryDatePick')}
          </StyledText>
        </Pressable>
        {EXPIRY_QUICK_PICKS.map((pick) => (
          <Pressable
            key={pick.label}
            accessibilityRole="button"
            accessibilityLabel={`${t('expiryDateLabel')}: ${pick.label}`}
            onPress={() => onChange(expiryFromToday(pick.days))}
            className="min-h-[44px] px-4 rounded-full border border-ink-200 bg-paper-50 items-center justify-center active:bg-paper-100"
          >
            <StyledText variant="semibold" className="text-sm text-ink-700">
              {pick.label}
            </StyledText>
          </Pressable>
        ))}
        {value !== '' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('expiryDateClear')}
            onPress={() => onChange('')}
            className="min-h-[44px] px-4 rounded-full border border-ink-200 bg-paper-50 items-center justify-center active:bg-paper-100"
          >
            <StyledText variant="semibold" className="text-sm text-ink-700">
              {t('expiryDateClear')}
            </StyledText>
          </Pressable>
        ) : null}
      </View>

      <DatePickerSheet
        visible={pickerOpen}
        value={value}
        onClose={() => setPickerOpen(false)}
        onConfirm={(iso) => {
          onChange(iso);
          setPickerOpen(false);
        }}
        highlight={{ from: addDaysIso(0), to: addDaysIso(windowDays) }}
        shortcuts={EXPIRY_QUICK_PICKS}
        describe={describe}
        labels={{
          title: t('expiryDateLabel'),
          noDate: t('expiryPickerNoDate'),
          confirm: t('expiryPickerConfirm'),
          clear: t('expiryDateClear'),
          today: t('expiryPickerToday'),
          prevMonth: t('expiryPickerPrevMonth'),
          nextMonth: t('expiryPickerNextMonth'),
          chooseMonth: t('expiryPickerChooseMonth'),
          prevYear: t('expiryPickerPrevYear'),
          nextYear: t('expiryPickerNextYear'),
          highlight: t('expiryPickerWindow', { count: windowDays }),
        }}
      />
    </View>
  );
}
