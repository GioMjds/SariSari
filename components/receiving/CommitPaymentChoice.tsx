import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';

interface Props {
  amount: number;
  paidNow: boolean;
  dueInDays: string;
  onChangePaidNow: (paidNow: boolean) => void;
  onChangeDueInDays: (days: string) => void;
}

/** Paid now / Pay later choice shown on the delivery review step. */
export function CommitPaymentChoice({
  amount,
  paidNow,
  dueInDays,
  onChangePaidNow,
  onChangeDueInDays,
}: Props) {
  const { t } = useTranslation('receiving');
  const options = [
    { value: true, label: t('paidNow') },
    { value: false, label: t('payLater') },
  ];

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4 gap-y-3">
      <View className="flex-row justify-between items-center">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          {t('paymentHeading')}
        </StyledText>
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-base"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatPesos(amount)}
        </StyledText>
      </View>

      <View className="flex-row gap-x-2" accessibilityRole="radiogroup">
        {options.map((o) => {
          const active = paidNow === o.value;
          return (
            <Pressable
              key={o.label}
              onPress={() => onChangePaidNow(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={o.label}
              className={`flex-1 min-h-[44px] rounded-xl items-center justify-center border ${
                active ? 'bg-cinnamon-500 border-cinnamon-500' : 'bg-paper-100 border-paper-300'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-sm ${active ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {o.label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>

      {paidNow ? (
        <StyledText variant="regular" className="text-ink-500 text-xs">
          {t('paidNowHint')}
        </StyledText>
      ) : (
        <View className="flex-row items-center gap-x-2">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('dueIn')}
          </StyledText>
          <TextInput
            value={dueInDays}
            onChangeText={(v) => onChangeDueInDays(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="-"
            placeholderTextColor="#A89F90"
            accessibilityLabel={t('dueInDaysLabel')}
            className="w-16 bg-paper-100 border border-ink-200 rounded-xl px-3 py-2 text-ink-900 text-base text-center font-stack-sans"
          />
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('days')}
          </StyledText>
        </View>
      )}
    </View>
  );
}
