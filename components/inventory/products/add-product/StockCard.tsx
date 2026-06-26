import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { AddProductFormData, STOCK_PRESETS } from './useAddProductForm';

interface StockCardProps {
  control: Control<AddProductFormData>;
  initialStock: string;
  onBumpStock: (delta: number) => void;
}

/**
 * StockCard — the third parchment card on the form.
 *
 * Holds:
 *   • Initial stock quantity input (numeric).
 *   • Quick-bump chips (`+5`, `+10`, `+20`). Tapping a chip parses
 *     the current input as an integer, adds the chip amount, and
 *     writes the result back — so `10 → +5 → 15`.
 */
export function StockCard({
  control,
  initialStock,
  onBumpStock,
}: StockCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Stock
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          How many pieces are you putting on the shelf right now?
        </StyledText>
      </View>

      <View className="mb-3">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Initial Stock Quantity
        </StyledText>
        <Controller
          control={control}
          name="initialStock"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="0"
              placeholderTextColor="#A89F90"
              value={initialStock}
              onChangeText={onChange}
              keyboardType="number-pad"
              accessibilityLabel="Initial stock quantity"
              className="bg-paper-100 text-ink-900 text-base border border-ink-200 rounded-xl px-4 py-3"
            />
          )}
        />
        <StyledText variant="regular" className="text-ink-400 text-xs mt-1">
          You can leave this as 0 and add stock later via the Catalog
        </StyledText>
      </View>

      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Quick Add
        </StyledText>
        <View className="flex-row gap-2">
          {STOCK_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => onBumpStock(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${preset} to stock`}
              className="press-scale flex-1 items-center py-2.5 rounded-xl bg-paper-100 border border-ink-200 active:opacity-80"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#EFE6D2' : '#F6F0E2',
              })}
            >
              <StyledText variant="extrabold" className="text-ink-900 text-sm">
                +{preset}
              </StyledText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}