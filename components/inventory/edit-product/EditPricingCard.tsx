import { Control, Controller } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import type { EditProductFormData } from './useEditProductForm';

interface EditPricingCardProps {
  control: Control<EditProductFormData>;
  /** Live profit-per-piece (integer pesos). 0 hides the preview card. */
  profitPerPiece: number;
  /** Live markup percentage. 0 hides the preview card. */
  markupPercent: number;
  /** True when the user has set price ≤ cost — flips preview to red. */
  isLossWarning: boolean;
}

/**
 * EditPricingCard — the pricing & profit parchment card.
 *
 * Holds:
 *   • Cost Price per Piece (₱) — optional; leave blank for no-cost items.
 *   • Selling Price (₱) — required.
 *   • Profit/Markup preview — sage ribbon that appears only when both
 *     cost and price parse to positive integers. Flips to danger tone
 *     when price ≤ cost (a loss-making item).
 *
 * The preview's two stat columns (Profit ₱ / Markup %) live inline so
 * the cashier sees the impact of every keystroke.
 */
export function EditPricingCard({
  control,
  profitPerPiece,
  markupPercent,
  isLossWarning,
}: EditPricingCardProps) {
  const showPreview = profitPerPiece !== 0 || markupPercent !== 0;

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Pricing &amp; Profit
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Set what you paid and what you charge
        </StyledText>
      </View>

      {/* Cost Price */}
      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Cost Price per Piece (₱)
        </StyledText>
        <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
          <StyledText variant="medium" className="text-ink-600 text-base mr-2">
            ₱
          </StyledText>
          <Controller
            control={control}
            name="costPerPiece"
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder="5.00"
                placeholderTextColor="#A89F90"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                accessibilityLabel="Cost price per piece"
                className="flex-1 text-ink-900 text-base"
              />
            )}
          />
        </View>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-1">
          The price you paid when buying this product. Used to calculate
          profit.
        </StyledText>
      </View>

      {/* Selling Price */}
      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Selling Price (₱){' '}
          <StyledText className="text-persimmon-500">*</StyledText>
        </StyledText>
        <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
          <StyledText variant="medium" className="text-ink-600 text-base mr-2">
            ₱
          </StyledText>
          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder="0.00"
                placeholderTextColor="#A89F90"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                accessibilityLabel="Selling price"
                className="flex-1 text-ink-900 text-base"
              />
            )}
          />
        </View>
      </View>

      {/* Live Profit / Markup Preview */}
      {showPreview && (
        <View
          className={`mt-3 rounded-lg p-3 flex-row items-center justify-between ${
            isLossWarning
              ? 'bg-semantic-danger-50 border-l-4 border-semantic-danger'
              : 'bg-sage-50 border-l-4 border-sage-500'
          }`}
        >
          <View>
            <StyledText
              variant="regular"
              className={`text-xs mb-1 ${
                isLossWarning ? 'text-semantic-danger' : 'text-sage-700'
              }`}
            >
              Profit per Piece (Tubo)
            </StyledText>
            <StyledText
              variant="extrabold"
              className={`text-lg ${
                isLossWarning ? 'text-semantic-danger' : 'text-sage-700'
              }`}
            >
              ₱
              {profitPerPiece.toFixed(2)}
            </StyledText>
          </View>
          <View className="items-end">
            <StyledText
              variant="regular"
              className={`text-xs mb-1 ${
                isLossWarning ? 'text-semantic-danger' : 'text-sage-700'
              }`}
            >
              Markup
            </StyledText>
            <StyledText
              variant="extrabold"
              className={`text-lg ${
                isLossWarning ? 'text-semantic-danger' : 'text-sage-700'
              }`}
            >
              {markupPercent.toFixed(1)}%
            </StyledText>
          </View>
        </View>
      )}
    </View>
  );
}