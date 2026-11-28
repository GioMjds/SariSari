import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Skeleton } from '@/components/ui';
import { SariMascot } from '@/components/mascot';

/** Placeholder shaped like the suki strip and amount card, so the layout does not jump on load. */
export function AddPaymentSkeleton() {
  const { t } = useTranslation('common');

  return (
    <View
      className="px-4 pt-4 gap-3"
      accessible
      accessibilityLabel={t('loading')}
      accessibilityState={{ busy: true }}
    >
      <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4">
        <View className="flex-row items-center">
          <Skeleton width={48} height={48} circle />
          <View className="flex-1 ml-3 gap-2">
            <Skeleton width={'60%'} height={16} />
            <Skeleton width={'40%'} height={12} />
          </View>
          <Skeleton width={84} height={22} />
        </View>
      </View>
      <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 gap-3">
        <Skeleton width={120} height={14} />
        <Skeleton width={'100%'} height={68} borderRadius={12} />
        <View className="flex-row gap-2">
          <Skeleton width={96} height={48} borderRadius={12} />
          <Skeleton width={72} height={48} borderRadius={12} />
          <Skeleton width={72} height={48} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

/** Shown when the suki cannot be loaded, usually because they were deleted. */
export function AddPaymentLoadError({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('utang');
  const { t: tc } = useTranslation('common');

  return (
    <View className="flex-1 items-center justify-center px-8">
      <SariMascot state="error" size={120} />
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-900 text-lg mt-3 text-center"
      >
        {t('addPaymentLoadErrorTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-600 text-sm mt-1 text-center"
      >
        {t('addPaymentLoadErrorBody')}
      </StyledText>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        className="press-scale mt-5 min-h-[48px] px-6 rounded-xl bg-persimmon-600 active:bg-persimmon-700 items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-base">
          {tc('back')}
        </StyledText>
      </Pressable>
    </View>
  );
}
