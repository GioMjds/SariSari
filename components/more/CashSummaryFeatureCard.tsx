import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos, type Pesos } from '@/lib';

export type CashSummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; paidExpenses: Pesos; ownerDrawings: Pesos };

export type CashSummaryFeatureCardProps = {
  state: CashSummaryState;
  onPress: () => void;
};

export function CashSummaryFeatureCard({
  state,
  onPress,
}: CashSummaryFeatureCardProps) {
  const { t } = useTranslation();
  const title = t('common:moreHomeCashLabel');
  const isEmpty =
    state.status === 'ready' &&
    state.paidExpenses === 0 &&
    state.ownerDrawings === 0;

  const supportingText =
    state.status === 'loading'
      ? t('common:moreHomeCashLoading')
      : state.status === 'error'
        ? t('common:moreHomeCashError')
        : isEmpty
          ? t('common:moreHomeCashEmpty')
          : t('common:moreHomeCashSummary', {
              expenses: formatPesos(state.paidExpenses),
              drawings: formatPesos(state.ownerDrawings),
            });

  const actionText =
    state.status === 'loading'
      ? t('common:moreHomeCashOpenAction')
      : state.status === 'error'
        ? t('common:moreHomeCashCheckAction')
        : t('common:moreHomeCashReviewAction');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${supportingText}. ${actionText}`}
      accessibilityHint={t('common:moreHomeCashHint')}
      style={{ minHeight: 164 }}
      className="rounded-[20px] bg-persimmon-600 p-5 active:opacity-80"
    >
      <View className="flex-1 justify-between">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-paper-50/15">
          <FontAwesome name="money" size={22} color="#FAFAF7" />
        </View>

        <View className="mt-5">
          <StyledText variant="extrabold" className="text-xl text-paper-50">
            {title}
          </StyledText>
          <StyledText
            variant="regular"
            className="mt-2 text-sm text-paper-50 opacity-90"
          >
            {supportingText}
          </StyledText>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <StyledText variant="semibold" className="text-sm text-paper-50">
            {actionText}
          </StyledText>
          <FontAwesome name="arrow-right" size={16} color="#FAFAF7" />
        </View>
      </View>
    </Pressable>
  );
}
