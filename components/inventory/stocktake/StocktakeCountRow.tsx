import { View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

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
  const unit = product.retail_unit_name || 'Pc';
  const base = countedQty ?? 0;
  const delta = countedQty === null ? null : countedQty - expectedQty;

  // Status uses text plus icon so meaning never depends on color alone.
  const status: { icon: IconName; color: string; cls: string; text: string } =
    delta === null
      ? { icon: 'circle-o', color: '#564E45', cls: 'text-ink-500', text: t('notCounted') }
      : delta === 0
        ? { icon: 'check-circle', color: '#4F7A24', cls: 'text-sage-700', text: t('matches') }
        : delta < 0
          ? { icon: 'arrow-down', color: '#C13030', cls: 'text-semantic-danger', text: t('shortBy', { count: -delta, unit }) }
          : { icon: 'arrow-up', color: '#2E6FA8', cls: 'text-semantic-info', text: t('extraBy', { count: delta, unit }) };

  return (
    <View className="bg-paper-50 rounded-xl p-3 border border-paper-300 gap-y-3 mb-2">
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
            {t('appSays', { qty: expectedQty, unit })}
          </StyledText>
        </View>
        <View className="flex-row items-center gap-x-1 pt-1">
          <FontAwesome name={status.icon} size={13} color={status.color} />
          <StyledText variant="extrabold" className={`text-sm ${status.cls}`}>
            {status.text}
          </StyledText>
        </View>
      </View>

      <View className="flex-row items-center gap-x-2">
        <TouchableOpacity
          onPress={() => onCountChange(Math.max(0, base - 1))}
          accessibilityRole="button"
          accessibilityLabel={t('decreaseCount')}
          className="w-12 h-12 rounded-lg bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-200"
        >
          <FontAwesome name="minus" size={14} color="#28231D" />
        </TouchableOpacity>

        <TextInput
          value={countedQty === null ? '' : String(countedQty)}
          placeholder="—"
          placeholderTextColor="#7A7165"
          accessibilityLabel={`${product.name}, ${t('counted')}`}
          onChangeText={(txt) => {
            const val = parseInt(txt.replace(/[^0-9]/g, ''), 10);
            onCountChange(Number.isNaN(val) ? 0 : val);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
          className="w-20 h-12 bg-paper-100 border border-paper-400 rounded-lg text-center font-bold text-lg text-ink-900"
        />

        <TouchableOpacity
          onPress={() => onCountChange(base + 1)}
          accessibilityRole="button"
          accessibilityLabel={t('increaseCount')}
          className="w-12 h-12 rounded-lg bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-200"
        >
          <FontAwesome name="plus" size={14} color="#28231D" />
        </TouchableOpacity>

        {delta !== 0 ? (
          <TouchableOpacity
            onPress={() => onCountChange(expectedQty)}
            accessibilityRole="button"
            accessibilityLabel={t('sameAsAppA11y', { qty: expectedQty, unit })}
            className="flex-1 h-12 rounded-lg bg-sage-50 border border-sage-200 flex-row items-center justify-center gap-x-1.5 active:bg-sage-100"
          >
            <FontAwesome name="check" size={12} color="#2C4413" />
            <StyledText variant="extrabold" className="text-sage-700 text-sm">
              {t('sameAsApp', { qty: expectedQty })}
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
