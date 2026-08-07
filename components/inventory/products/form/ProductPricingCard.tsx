import { FontAwesome } from '@expo/vector-icons';
import type { RefObject } from 'react';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { calculateWholesaleSavings, formatPesos, tryParsePesosInput } from '@/lib';

export const MARKUP_PRESETS = [0.1, 0.2, 0.3, 0.5] as const;
export type MarkupPreset = (typeof MARKUP_PRESETS)[number];

interface ProductPricingCardProps {
  control: Control<any>;
  costPerPiece: string;
  price: string;
  useBundlePricing?: boolean;
  onToggleBundlePricing?: () => void;
  onApplyMarkupPreset: (markup: MarkupPreset) => void;
  profitPerPiece: number;
  markupPercent: number;
  isLossWarning: boolean;
  priceInputRef?: RefObject<TextInput | null>;
  enableWholesale?: boolean;
  onToggleWholesale?: () => void;
  retailUnitName?: string;
  wholesaleUnitName?: string;
  conversionFactor?: string;
  wholesalePrice?: string;
  wholesaleCostPrice?: string;
}

export function ProductPricingCard({
  control,
  costPerPiece,
  price,
  useBundlePricing = false,
  onToggleBundlePricing,
  onApplyMarkupPreset,
  profitPerPiece,
  markupPercent,
  isLossWarning,
  priceInputRef,
  enableWholesale = false,
  onToggleWholesale,
  retailUnitName = 'Pc',
  wholesaleUnitName = 'Case',
  conversionFactor = '12',
  wholesalePrice = '',
  wholesaleCostPrice = '',
}: ProductPricingCardProps) {
  const hasCost = !!costPerPiece && costPerPiece !== '0.00';
  const hasPrice = !!price && price !== '0.00';

  const retailPriceVal = tryParsePesosInput(price);
  const wholesalePriceVal = wholesalePrice
    ? tryParsePesosInput(wholesalePrice)
    : 0;
  const conversionFactorNum = conversionFactor
    ? parseInt(conversionFactor, 10)
    : 0;
  const savings = calculateWholesaleSavings(
    retailPriceVal,
    wholesalePriceVal,
    conversionFactorNum,
  );

  return (
    <View className="bg-paper-50 rounded-2xl border border-dashed border-ink-300 p-4">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <StyledText variant="black" className="label-caps text-cinnamon-500">
            Pricing & Profit
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
            Set your cost, choose a markup, lock in the price
          </StyledText>
        </View>

        {onToggleBundlePricing && (
          <Pressable
            onPress={onToggleBundlePricing}
            accessibilityRole="switch"
            accessibilityState={{ checked: useBundlePricing }}
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
        )}
      </View>

      {useBundlePricing ? (
        <>
          <View className="mb-3">
            <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
              Total Bundle Cost
            </StyledText>
            <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
              <StyledText variant="extrabold" className="text-ink-700 text-base mr-2">
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
                    className="flex-1 text-ink-900 text-base"
                  />
                )}
              />
            </View>
          </View>

          <View className="mb-3">
            <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
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
                  className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-base"
                />
              )}
            />
          </View>

          <View className="mb-3">
            <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
              Cost per Piece
            </StyledText>
            <View className="bg-paper-100/60 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center opacity-70">
              <StyledText variant="extrabold" className="text-ink-500 text-base mr-2">
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
                    className="flex-1 text-ink-700 text-base"
                  />
                )}
              />
            </View>
          </View>
        </>
      ) : (
        <View className="mb-3">
          <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
            Cost Price (per piece)
          </StyledText>
          <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
            <StyledText variant="extrabold" className="text-ink-700 text-base mr-2">
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
                  className="flex-1 text-ink-900 text-base"
                />
              )}
            />
          </View>
        </View>
      )}

      <View className="mb-4">
        <StyledText variant="medium" className="text-ink-400 text-xs mb-2">
          QUICK MARKUP
        </StyledText>
        <View className="flex-row flex-wrap gap-2">
          {MARKUP_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => onApplyMarkupPreset(preset)}
              className="press-scale bg-paper-100 border border-ink-200 rounded-pill px-3 py-1.5 active:bg-paper-200"
            >
              <StyledText
                variant="extrabold"
                className="text-cinnamon-600 text-xs"
              >
                +{(preset * 100).toFixed(0)}%
              </StyledText>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-1">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Selling Price (per piece) <StyledText className="text-persimmon-500">*</StyledText>
        </StyledText>
        <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
          <StyledText variant="extrabold" className="text-ink-700 text-base mr-2">
            ₱
          </StyledText>
          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange } }) => (
              <TextInput
                ref={priceInputRef}
                placeholder="0.00"
                placeholderTextColor="#A89F90"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                className="flex-1 text-ink-900 text-base"
              />
            )}
          />
        </View>

        {isLossWarning && (
          <View className="mt-2 flex-row items-center bg-semantic-warning/10 rounded-xl px-3 py-2 border border-semantic-warning/20">
            <FontAwesome name="exclamation-triangle" size={12} color="#C77B0E" />
            <StyledText variant="semibold" className="text-semantic-warning text-xs ml-2 flex-1">
              Selling price is below or equal to cost price
            </StyledText>
          </View>
        )}
      </View>

      {hasCost && hasPrice && (
        <View className="mt-4 bg-sage-50 border border-sage-100 rounded-xl px-4 py-3">
          <StyledText variant="black" className="label-caps text-sage-600">
            Profit Receipt
          </StyledText>
          <View className="flex-row items-end justify-between mt-2">
            <View>
              <StyledText variant="medium" className="text-sage-600 text-xs mb-0.5">
                Profit per piece
              </StyledText>
              <StyledText variant="extrabold" className="text-sage-600 text-h2">
                ₱{profitPerPiece.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </StyledText>
            </View>
            <View className="items-end">
              <StyledText variant="medium" className="text-sage-600 text-xs mb-0.5">
                Markup
              </StyledText>
              <StyledText variant="extrabold" className="text-sage-600 text-h2">
                {markupPercent.toFixed(1)}%
              </StyledText>
            </View>
          </View>
        </View>
      )}

      <View className="mt-6 pt-4 border-t border-ink-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-3">
            <StyledText variant="black" className="label-caps text-cinnamon-500">
              Wholesale (Pakyaw) Tier
            </StyledText>
            <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
              Offer bulk pricing for suki & bulk buyers
            </StyledText>
          </View>
          {onToggleWholesale && (
            <Pressable
              onPress={onToggleWholesale}
              className={`press-scale flex-row items-center border rounded-pill px-3 py-1.5 ${
                enableWholesale
                  ? 'bg-cinnamon-500 border-cinnamon-600'
                  : 'bg-paper-100 border-ink-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`label-caps ${enableWholesale ? 'text-white' : 'text-ink-700'}`}
              >
                {enableWholesale ? 'Enabled' : 'Disabled'}
              </StyledText>
            </Pressable>
          )}
        </View>

        {enableWholesale && (
          <View className="mt-2 space-y-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <StyledText variant="semibold" className="text-ink-900 text-xs mb-1">
                  Tingi Unit (Retail)
                </StyledText>
                <Controller
                  control={control}
                  name="retailUnitName"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      placeholder="Pc, Pack"
                      placeholderTextColor="#A89F90"
                      value={value}
                      onChangeText={onChange}
                      className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 text-ink-900 text-sm"
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <StyledText variant="semibold" className="text-ink-900 text-xs mb-1">
                  Pakyaw Unit (Bulk)
                </StyledText>
                <Controller
                  control={control}
                  name="wholesaleUnitName"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      placeholder="Case, Box"
                      placeholderTextColor="#A89F90"
                      value={value}
                      onChangeText={onChange}
                      className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 text-ink-900 text-sm"
                    />
                  )}
                />
              </View>
            </View>

            <View>
              <StyledText variant="semibold" className="text-ink-900 text-xs mb-1">
                Pieces per Pakyaw Unit
              </StyledText>
              <Controller
                control={control}
                name="conversionFactor"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    placeholder="12, 24, etc."
                    placeholderTextColor="#A89F90"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 text-ink-900 text-sm"
                  />
                )}
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <StyledText variant="semibold" className="text-ink-900 text-xs mb-1">
                  Pakyaw Selling Price
                </StyledText>
                <View className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 flex-row items-center">
                  <StyledText variant="extrabold" className="text-ink-700 text-sm mr-1">
                    ₱
                  </StyledText>
                  <Controller
                    control={control}
                    name="wholesalePrice"
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor="#A89F90"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="decimal-pad"
                        className="flex-1 text-ink-900 text-sm"
                      />
                    )}
                  />
                </View>
              </View>

              <View className="flex-1">
                <StyledText variant="semibold" className="text-ink-900 text-xs mb-1">
                  Pakyaw Cost Price
                </StyledText>
                <View className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 flex-row items-center">
                  <StyledText variant="extrabold" className="text-ink-700 text-sm mr-1">
                    ₱
                  </StyledText>
                  <Controller
                    control={control}
                    name="wholesaleCostPrice"
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor="#A89F90"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="decimal-pad"
                        className="flex-1 text-ink-900 text-sm"
                      />
                    )}
                  />
                </View>
              </View>
            </View>

            {savings && (
              <View className="mt-3 rounded-xl bg-cinnamon-50 dark:bg-cinnamon-950/30 p-3.5 border border-cinnamon-200/50">
                <StyledText variant="medium" className="text-cinnamon-800 dark:text-cinnamon-200 text-xs">
                  Selling at wholesale price ({formatPesos(wholesalePriceVal)}/{wholesaleUnitName}) is equivalent to {formatPesos(savings.equivalentRetailPrice)} per {retailUnitName} (saving customer {formatPesos(savings.savingsPerPiece)} or {savings.savingsPercent}%).
                </StyledText>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
