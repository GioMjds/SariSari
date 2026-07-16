import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import {
  calculateWholesaleSavings,
  formatPesos,
  tryParsePesosInput,
} from '@/lib';

interface EditPricingCardProps {
  control: Control<any>;
  profitPerPiece: number;
  markupPercent: number;
  isLossWarning: boolean;
  price?: string;
  enableWholesale?: boolean;
  onToggleWholesale?: () => void;
  retailUnitName?: string;
  wholesaleUnitName?: string;
  conversionFactor?: string;
  wholesalePrice?: string;
  wholesaleCostPrice?: string;
}

export function EditPricingCard({
  control,
  profitPerPiece,
  markupPercent,
  isLossWarning,
  price = '',
  enableWholesale = false,
  onToggleWholesale,
  retailUnitName = 'Pc',
  wholesaleUnitName = 'Case',
  conversionFactor = '12',
  wholesalePrice = '',
  wholesaleCostPrice = '',
}: EditPricingCardProps) {
  const showPreview = profitPerPiece !== 0 || markupPercent !== 0;

  const retailPriceVal = tryParsePesosInput(price);
  const wholesalePriceVal = wholesalePrice ? tryParsePesosInput(wholesalePrice) : 0;
  const conversionFactorNum = conversionFactor ? parseInt(conversionFactor, 10) : 0;
  const savings = calculateWholesaleSavings(
    retailPriceVal,
    wholesalePriceVal,
    conversionFactorNum,
  );

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
              ? 'bg-semantic-danger-50 border border-semantic-danger-100'
              : 'bg-sage-50 border border-sage-100'
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

      {/* Wholesale / Pakyaw Tier Section */}
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
                      placeholder="Pc, Bottle, Pack"
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
                      placeholder="Case, Box, Sack"
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
                  Selling at wholesale price ({formatPesos(wholesalePriceVal)}/{wholesaleUnitName}) is equivalent to {formatPesos(savings.equivalentRetailPrice)} per {retailUnitName} (saving the customer {formatPesos(savings.savingsPerPiece)} or {savings.savingsPercent}% compared to retail).
                </StyledText>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
