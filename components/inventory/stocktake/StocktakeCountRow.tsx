import { View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';

interface StocktakeCountRowProps {
  product: Product;
  expectedQty: number;
  countedQty: number | null;
  onCountChange: (qty: number) => void;
}

export function StocktakeCountRow({
  product,
  expectedQty,
  countedQty,
  onCountChange,
}: StocktakeCountRowProps) {
  const { t } = useTranslation('stocktake');
  const base = countedQty ?? 0;
  const addChip = (amount: number) => {
    onCountChange(base + amount);
  };

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
            {t('expected')}: {expectedQty} {product.retail_unit_name || 'Pc'}
          </StyledText>
        </View>
        {countedQty === null ? (
          <StyledText variant="semibold" className="text-ink-400 text-xs">
            {t('notCounted')}
          </StyledText>
        ) : countedQty !== expectedQty ? (
          <View
            className={`px-2 py-0.5 rounded-full ${
              countedQty - expectedQty < 0 ? 'bg-rose-100' : 'bg-sage-100'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${
                countedQty - expectedQty < 0 ? 'text-rose-700' : 'text-sage-800'
              }`}
            >
              {countedQty - expectedQty > 0
                ? `+${countedQty - expectedQty}`
                : countedQty - expectedQty}
            </StyledText>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-x-2">
        {/* Decrement */}
        <TouchableOpacity
          onPress={() => onCountChange(Math.max(0, base - 1))}
          className="w-10 h-10 rounded-lg bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-200"
          accessibilityLabel={t('decreaseCount')}
        >
          <FontAwesome name="minus" size={12} color="#564E45" />
        </TouchableOpacity>

        {/* Input */}
        <TextInput
          value={countedQty === null ? '' : String(countedQty)}
          placeholder="?"
          placeholderTextColor="#A1978A"
          accessibilityLabel={`${product.name}, ${t('counted')}`}
          onChangeText={(txt) => {
            const val = parseInt(txt.replace(/[^0-9]/g, ''), 10);
            onCountChange(Number.isNaN(val) ? 0 : val);
          }}
          keyboardType="number-pad"
          className="flex-1 h-10 bg-paper-100 border border-paper-300 rounded-lg text-center font-bold text-ink-900"
        />

        {/* Quick chips +1, +2, +5 */}
        {[1, 2, 5].map((inc) => (
          <TouchableOpacity
            key={inc}
            onPress={() => addChip(inc)}
            className="h-10 px-3 rounded-lg bg-persimmon-50 border border-persimmon-200 items-center justify-center active:bg-persimmon-100"
          >
            <StyledText
              variant="extrabold"
              className="text-persimmon-700 text-xs"
            >
              +{inc}
            </StyledText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
