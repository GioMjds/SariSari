import { Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { ICON_COLOR } from '@/lib/theme';

/** Parses the terms field: blank means pay on delivery. */
export const parseTermsDays = (v: string): number | null =>
  /^\d+$/.test(v.trim()) ? Number(v.trim()) : null;

/** Optional supplier payment terms in days, shared by the add and edit supplier forms. */
// control stays untyped like the forms' SubcomponentProps, since each form has its own field set.
export function PaymentTermsCard({ control }: { control: any }) {
  const { t } = useTranslation('receiving');
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mt-3 mb-4">
      <StyledText variant="extrabold" accessibilityRole="header" className="text-ink-900 text-base">
        {t('paymentTermsLabel')}
      </StyledText>
      <StyledText variant="regular" className="text-ink-600 text-xs mt-0.5 mb-3">
        {t('paymentTermsHint')}
      </StyledText>
      <Controller
        control={control}
        name="terms"
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="flex-row items-center gap-x-2">
            <TextInput
              value={value}
              onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
              onBlur={onBlur}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="-"
              placeholderTextColor={ICON_COLOR.inkMuted}
              accessibilityLabel={t('paymentTermsLabel')}
              className="min-w-20 min-h-[44px] bg-paper-100 border border-ink-200 rounded-xl px-3 text-ink-900 text-base text-center font-stack-sans"
            />
            <StyledText variant="semibold" className="text-ink-900 text-sm">
              {t('days')}
            </StyledText>
          </View>
        )}
      />
    </View>
  );
}
