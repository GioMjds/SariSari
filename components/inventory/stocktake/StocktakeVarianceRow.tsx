import { View, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { STOCKTAKE_REASONS, StocktakeReason } from '@/configs/stocktakeReasons';
import type { Product } from '@/types/products.types';
import type { StocktakeCount } from '@/types/stocktake.types';

interface StocktakeVarianceRowProps {
  product: Product;
  count: StocktakeCount;
  reasonCode: StocktakeReason | null;
  note: string;
  onReasonChange: (reason: StocktakeReason) => void;
  onNoteChange: (note: string) => void;
}

export function StocktakeVarianceRow({
  product,
  count,
  reasonCode,
  note,
  onReasonChange,
  onNoteChange,
}: StocktakeVarianceRowProps) {
  const { t } = useTranslation('stocktake');
  const delta = count.countedQty - count.expectedQty;
  const isZero = delta === 0;
  const pesoImpact = Math.round(delta * (product.cost_price ?? 0) * 100) / 100;
  const unit = product.retail_unit_name || 'Pc';

  return (
    <View
      className={`bg-paper-50 rounded-xl p-3 border gap-y-3 mb-2 ${
        reasonCode ? 'border-paper-300' : 'border-persimmon-200'
      }`}
    >
      <View className="flex-row items-start justify-between gap-x-2">
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base"
            numberOfLines={2}
          >
            {product.name}
          </StyledText>
          <StyledText variant="medium" className="text-ink-600 text-sm">
            {t('appSaidCounted', {
              expected: count.expectedQty,
              counted: count.countedQty,
              unit,
            })}
          </StyledText>
        </View>
        <View className="items-end">
          <StyledText
            variant="extrabold"
            className={`text-sm ${delta < 0 ? 'text-semantic-danger' : 'text-semantic-info'}`}
          >
            {delta < 0
              ? t('shortBy', { count: -delta, unit })
              : t('extraBy', { count: delta, unit })}
          </StyledText>
          <MoneyText
            value={pesoImpact}
            size="sm"
            variant={pesoImpact < 0 ? 'danger' : 'default'}
          />
        </View>
      </View>

      {!isZero ? (
        <View className="gap-y-2 border-t border-paper-300 pt-3">
          <StyledText variant="semibold" className="text-ink-800 text-sm">
            {t('selectReason')}
          </StyledText>
          <View className="flex-row flex-wrap gap-1">
            {STOCKTAKE_REASONS.map((r) => {
              const isSelected = reasonCode === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => onReasonChange(r)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={`px-3 py-2 rounded-lg border min-h-[44px] justify-center ${
                    isSelected
                      ? 'bg-persimmon-500 border-persimmon-600'
                      : 'bg-paper-100 border-paper-300'
                  }`}
                >
                  <StyledText
                    variant="semibold"
                    className={`text-sm ${
                      isSelected ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {t(`reason.${r}`)}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            placeholder={t('lineNote')}
            value={note}
            onChangeText={onNoteChange}
            placeholderTextColor="#7A7165"
            accessibilityLabel={`${product.name}, ${t('lineNote')}`}
            className="bg-paper-100 border border-paper-300 rounded-lg px-3 min-h-[44px] text-sm text-ink-900"
          />
        </View>
      ) : null}
    </View>
  );
}
