import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import {
  AddProductFormData,
  MARKUP_PRESETS,
  MarkupPreset,
} from './useAddProductForm';

interface PricingProfitCardProps {
  control: Control<AddProductFormData>;
  costPerPiece: string;
  price: string;
  useBundlePricing: boolean;
  onToggleBundlePricing: () => void;
  onApplyMarkupPreset: (markup: MarkupPreset) => void;
  profitPerPiece: number;
  markupPercent: number;
  isLossWarning: boolean;
  hasCost: boolean;
  hasPrice: boolean;
}

/**
 * PricingProfitCard — the second parchment card on the form.
 *
 * Holds:
 *   • A Single Piece / Bundle toggle for cost entry.
 *     - Single mode: a direct "cost per piece" input.
 *     - Bundle mode: total bundle cost + pieces per bundle inputs;
 *       the form hook derives cost-per-piece from these.
 *   • Markup preset chips (`+10%`, `+20%`, `+30%`, `+50%`) that
 *     write `costPerPiece × (1 + M)` into the selling-price field.
 *   • Selling price input — the customer-facing price.
 *   • A warning banner if selling price ≤ cost.
 *   • The Sage-green Profit Receipt card showing live profit per
 *     piece and markup %.
 *
 * Pure presentation; every value and handler is supplied by the
 * route file from `useAddProductForm`.
 */
export function PricingProfitCard({
  control,
  costPerPiece,
  price,
  useBundlePricing,
  onToggleBundlePricing,
  onApplyMarkupPreset,
  profitPerPiece,
  markupPercent,
  isLossWarning,
  hasCost,
  hasPrice,
}: PricingProfitCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl border border-dashed border-ink-300 p-4">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <StyledText variant="black" className="label-caps text-cinnamon-500">
            Pricing & Profit
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-400 text-xs mt-0.5"
          >
            Set your cost, choose a markup, lock in the price
          </StyledText>
        </View>

        {/* Single / Bundle toggle */}
        <Pressable
          onPress={onToggleBundlePricing}
          accessibilityRole="switch"
          accessibilityState={{ checked: useBundlePricing }}
          accessibilityLabel="Enter cost as a bundle"
          hitSlop={8}
          className="press-scale flex-row items-center bg-paper-100 border border-ink-200 rounded-pill px-3 py-1.5 active:opacity-70"
        >
          <FontAwesome
            name={useBundlePricing ? 'cube' : 'tag'}
            size={11}
            color="#564E45"
          />
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-700 ml-1.5"
          >
            {useBundlePricing ? 'Bundle' : 'Single'}
          </StyledText>
        </Pressable>
      </View>

      {/* Cost inputs */}
      {useBundlePricing ? (
        <>
          <View className="mb-3">
            <StyledText
              variant="semibold"
              className="text-ink-900 text-sm mb-2"
            >
              Total Bundle Cost
            </StyledText>
            <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
              <StyledText
                variant="extrabold"
                className="text-ink-700 text-base mr-2"
              >
                ₱
              </StyledText>
              <Controller
                control={control}
                name="bundleCost"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#A89F90"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Total bundle cost"
                    className="flex-1 text-ink-900 text-base"
                  />
                )}
              />
            </View>
          </View>

          <View className="mb-3">
            <StyledText
              variant="semibold"
              className="text-ink-900 text-sm mb-2"
            >
              Pieces per Bundle
            </StyledText>
            <Controller
              control={control}
              name="piecesPerBundle"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="10"
                  placeholderTextColor="#A89F90"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  accessibilityLabel="Pieces per bundle"
                  className="bg-paper-100 text-ink-900 text-base border border-ink-200 rounded-xl px-4 py-3"
                />
              )}
            />
          </View>

          <View>
            <StyledText
              variant="semibold"
              className="text-ink-900 text-sm mb-2"
            >
              Cost per Piece
            </StyledText>
            <View className="bg-paper-100/60 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center opacity-70">
              <StyledText
                variant="extrabold"
                className="text-ink-500 text-base mr-2"
              >
                ₱
              </StyledText>
              <Controller
                control={control}
                name="costPerPiece"
                render={({ field: { value } }) => (
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#A89F90"
                    value={value ?? costPerPiece}
                    editable={false}
                    accessibilityLabel="Cost per piece (auto-calculated)"
                    className="flex-1 text-ink-700 text-base"
                  />
                )}
              />
            </View>
            <StyledText
              variant="regular"
              className="text-ink-400 text-xs mt-1"
            >
              Auto-calculated from bundle cost ÷ pieces
            </StyledText>
          </View>
        </>
      ) : (
        <View>
          <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
            Cost per Piece
          </StyledText>
          <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
            <StyledText
              variant="extrabold"
              className="text-ink-700 text-base mr-2"
            >
              ₱
            </StyledText>
            <Controller
              control={control}
              name="costPerPiece"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#A89F90"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Cost per piece"
                  className="flex-1 text-ink-900 text-base"
                />
              )}
            />
          </View>
          <StyledText
            variant="regular"
            className="text-ink-400 text-xs mt-1"
          >
            The price you paid to stock this item — used to track profit.
          </StyledText>
        </View>
      )}

      {/* Markup presets */}
      <View className="mt-4 mb-3">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Quick Markup
        </StyledText>
        <View className="flex-row gap-2">
          {MARKUP_PRESETS.map((preset) => {
            const disabled = !hasCost;
            return (
              <Pressable
                key={preset}
                onPress={() => onApplyMarkupPreset(preset)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Apply ${Math.round(preset * 100)} percent markup`}
                className={`press-scale flex-1 items-center py-2.5 rounded-xl border ${
                  disabled
                    ? 'bg-paper-100 border-ink-100 opacity-50'
                    : 'bg-cinnamon-500 border-cinnamon-500 active:opacity-80'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-sm ${
                    disabled ? 'text-ink-400' : 'text-paper-50'
                  }`}
                >
                  +{Math.round(preset * 100)}%
                </StyledText>
              </Pressable>
            );
          })}
        </View>
        </View>

      {/* Selling price */}
      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Selling Price{' '}
          <StyledText className="text-persimmon-500">*</StyledText>
        </StyledText>
        <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
          <StyledText
            variant="extrabold"
            className="text-ink-700 text-base mr-2"
          >
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

        {isLossWarning && (
          <View className="mt-2 bg-semantic-warning-50 border border-semantic-warning-100 rounded-xl px-3 py-2 flex-row items-center">
            <FontAwesome name="exclamation-triangle" size={12} color="#C77B0E" />
            <StyledText
              variant="semibold"
              className="text-semantic-warning text-xs ml-2 flex-1"
            >
              Selling price is below or equal to cost price
            </StyledText>
          </View>
        )}
      </View>

      {/* Profit Receipt card */}
      {hasCost && hasPrice && (
        <View className="mt-4 bg-sage-50 border-l-4 border-sage-500 rounded-xl px-4 py-3">
          <StyledText variant="black" className="label-caps text-sage-600">
            Profit Receipt
          </StyledText>
          <View className="flex-row items-end justify-between mt-2">
            <View>
              <StyledText
                variant="medium"
                className="text-sage-600 text-xs mb-0.5"
              >
                Profit per piece
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-sage-600 text-h2"
              >
                ₱
                {profitPerPiece.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </StyledText>
            </View>
            <View className="items-end">
              <StyledText
                variant="medium"
                className="text-sage-600 text-xs mb-0.5"
              >
                Markup
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-sage-600 text-h2"
              >
                {markupPercent.toFixed(1)}%
              </StyledText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}