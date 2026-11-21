import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';

interface StocktakeVarianceSummaryProps {
  totalProducts: number;
  varianceCount: number;
  netVariancePesos: number;
}

export function StocktakeVarianceSummary({
  totalProducts,
  varianceCount,
  netVariancePesos,
}: StocktakeVarianceSummaryProps) {
  const { t } = useTranslation('stocktake');
  return (
    <View className="bg-paper-50 rounded-xl p-4 border border-paper-300 gap-y-1 mb-4">
      <StyledText variant="extrabold" className="text-ink-900 text-base">
        {t('varianceReview')}
      </StyledText>
      <View className="flex-row items-center justify-between mt-1">
        <StyledText variant="medium" className="text-ink-600 text-xs">
          {t('linesWithVariance', { variances: varianceCount, total: totalProducts })}
        </StyledText>
        <MoneyText
          value={netVariancePesos}
          className={`text-base font-extrabold ${
            netVariancePesos < 0 ? 'text-semantic-danger' : 'text-sage-700'
          }`}
        />
      </View>
    </View>
  );
}
