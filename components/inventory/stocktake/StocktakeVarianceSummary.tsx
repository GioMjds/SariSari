import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';

interface StocktakeVarianceSummaryProps {
  totalProducts: number;
  varianceCount: number;
  reasonsPicked: number;
  shortPesos: number;
  extraPesos: number;
  netVariancePesos: number;
}

export function StocktakeVarianceSummary({
  totalProducts,
  varianceCount,
  reasonsPicked,
  shortPesos,
  extraPesos,
  netVariancePesos,
}: StocktakeVarianceSummaryProps) {
  const { t } = useTranslation('stocktake');
  return (
    <View className="bg-paper-50 rounded-2xl p-4 border border-paper-300 gap-y-3 mb-4">
      <View className="gap-y-1">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-ink-900 text-lg"
        >
          {t('varianceReview')}
        </StyledText>
        <StyledText variant="regular" className="text-ink-700 text-sm">
          {t('linesWithVariance', { variances: varianceCount, total: totalProducts })}
        </StyledText>
      </View>

      <View className="flex-row gap-x-2">
        <View className="flex-1 bg-semantic-danger-50 rounded-xl p-3">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {t('shortLabel')}
          </StyledText>
          <MoneyText value={shortPesos} size="md" variant="danger" />
        </View>
        <View className="flex-1 bg-semantic-info-50 rounded-xl p-3">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {t('extraLabel')}
          </StyledText>
          <MoneyText value={extraPesos} size="md" />
        </View>
        <View className="flex-1 bg-paper-100 rounded-xl p-3">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {t('netLabel')}
          </StyledText>
          <MoneyText
            value={netVariancePesos}
            size="md"
            variant={netVariancePesos < 0 ? 'danger' : 'default'}
          />
        </View>
      </View>

      {varianceCount > 0 ? (
        <StyledText variant="semibold" className="text-ink-700 text-sm">
          {t('reasonsProgress', { picked: reasonsPicked, total: varianceCount })}
        </StyledText>
      ) : null}
    </View>
  );
}
