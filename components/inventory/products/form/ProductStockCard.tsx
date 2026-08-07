import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';

const STOCK_PRESETS = [5, 10, 20] as const;

interface ProductStockCardProps {
  control: Control<any>;
  stockValue: string;
  onBumpStock: (delta: number) => void;
  fieldName?: string;
}

export function ProductStockCard({
  control,
  stockValue,
  onBumpStock,
  fieldName = 'initialStock',
}: ProductStockCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Stock & Inventory
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Track starting quantity on hand
        </StyledText>
      </View>

      <View className="mb-3">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Stock Quantity
        </StyledText>
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="0"
              placeholderTextColor="#A89F90"
              value={value ?? stockValue}
              onChangeText={onChange}
              keyboardType="number-pad"
              accessibilityLabel="Stock quantity"
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-base"
            />
          )}
        />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {STOCK_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onBumpStock(preset)}
            className="press-scale bg-paper-100 border border-ink-200 rounded-pill px-3.5 py-1.5 active:bg-paper-200 flex-row items-center"
          >
            <FontAwesome name="plus" size={10} color="#623418" />
            <StyledText
              variant="extrabold"
              className="text-cinnamon-600 text-xs ml-1"
            >
              {preset}
            </StyledText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
