import { View, TextInput } from 'react-native';
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

  return (
    <View className="bg-paper-50 rounded-xl p-3 border border-paper-200 gap-y-2 mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {product.name}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs">
            Expected: {count.expectedQty} | Counted: {count.countedQty}
          </StyledText>
        </View>
        <View className="items-end">
          <StyledText
            variant="extrabold"
            className={`text-xs ${delta < 0 ? 'text-semantic-danger' : delta > 0 ? 'text-sage-700' : 'text-ink-500'}`}
          >
            Delta: {delta > 0 ? `+${delta}` : delta}
          </StyledText>
          <MoneyText
            value={pesoImpact}
            className={`text-xs font-semibold ${
              pesoImpact < 0 ? 'text-semantic-danger' : 'text-sage-700'
            }`}
          />
        </View>
      </View>

      {!isZero ? (
        <View className="gap-y-2 border-t border-paper-200 pt-2">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            Select Reason (Required):
          </StyledText>
          <View className="flex-row flex-wrap gap-1">
            {STOCKTAKE_REASONS.map((r) => {
              const isSelected = reasonCode === r;
              return (
                <View
                  key={r}
                  onTouchEnd={() => onReasonChange(r)}
                  className={`px-2.5 py-1.5 rounded-lg border ${
                    isSelected
                      ? 'bg-persimmon-500 border-persimmon-600'
                      : 'bg-paper-100 border-paper-300'
                  }`}
                >
                  <StyledText
                    variant="semibold"
                    className={`text-xs ${
                      isSelected ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {t(`reason.${r}`)}
                  </StyledText>
                </View>
              );
            })}
          </View>

          <TextInput
            placeholder="Optional line note..."
            value={note}
            onChangeText={onNoteChange}
            placeholderTextColor="#A1978A"
            className="bg-paper-100 border border-paper-300 rounded-lg px-3 py-1.5 text-xs text-ink-900"
          />
        </View>
      ) : null}
    </View>
  );
}
