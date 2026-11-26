import { type Ref, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { type Control, Controller, type UseFormSetValue, useWatch } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import { calculateWholesaleSavings, formatPesos, tryParsePesosInput } from '@/lib';
import { validateBarcode } from '@/lib/barcodes/format';
import { Field, INPUT_TEXT_CLASS, PLACEHOLDER_COLOR, SectionCard, ToggleRow, inputClass } from './FormPrimitives';
import { MARKUP_PRESETS, type ProductFormData } from './types';

interface ProductPricingSectionProps {
  control: Control<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  priceInputRef?: { current: TextInput | null };
  onPressScanCase: () => void;
}

const dirty = { shouldDirty: true } as const;

/** Cost, selling price with live profit, and the optional pakyaw (case) tier. */
export function ProductPricingSection({
  control,
  setValue,
  priceInputRef,
  onPressScanCase,
}: ProductPricingSectionProps) {
  const [byBundle, setByBundle] = useState(false);
  const [cost, price, bundleCost, pieces, enableWholesale] = useWatch({
    control,
    name: ['costPerPiece', 'price', 'bundleCost', 'piecesPerBundle', 'enableWholesale'],
  });

  const parsedCost = cost ? tryParsePesosInput(cost) : 0;
  const parsedPrice = price ? tryParsePesosInput(price) : 0;
  const profit = parsedPrice - parsedCost;
  const markup = parsedCost > 0 ? (profit / parsedCost) * 100 : 0;
  const isLoss = parsedCost > 0 && parsedPrice > 0 && profit <= 0;

  // Bundle mode derives cost per piece from what was paid for the whole pack.
  useEffect(() => {
    if (!byBundle) return;
    const total = tryParsePesosInput(bundleCost);
    const count = parseInt(pieces, 10);
    if (total > 0 && count > 0) setValue('costPerPiece', (total / count).toFixed(2), dirty);
  }, [byBundle, bundleCost, pieces, setValue]);

  return (
    <SectionCard title="Pricing" hint="What you paid and what you charge">
      <View>
        <Controller
          control={control}
          name="costPerPiece"
          render={({ field: { value, onChange } }) => (
            <Field
              label="Cost per piece"
              hint={byBundle ? 'Calculated from the bundle below.' : 'Used to show your profit (tubo).'}
              aside={
                <Pressable
                  onPress={() => setByBundle((b) => !b)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: byBundle }}
                  accessibilityLabel="Enter cost by bundle"
                  className="min-h-[44px] -my-3 flex-row items-center active:opacity-70"
                >
                  <FontAwesome name={byBundle ? 'check-square' : 'square-o'} size={14} color="#C8460F" />
                  <StyledText variant="semibold" className="text-persimmon-700 text-xs ml-1.5">
                    Bought by bundle
                  </StyledText>
                </Pressable>
              }
            >
              <PesoInput
                value={value}
                onChange={onChange}
                editable={!byBundle}
                label="Cost per piece"
              />
            </Field>
          )}
        />

        {byBundle ? (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} className="flex-row gap-x-3 mt-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="bundleCost"
                render={({ field: { value, onChange } }) => (
                  <Field label="Bundle total">
                    <PesoInput value={value} onChange={onChange} label="Bundle total cost" />
                  </Field>
                )}
              />
            </View>
            <View className="w-28">
              <Controller
                control={control}
                name="piecesPerBundle"
                render={({ field: { value, onChange } }) => (
                  <Field label="Pieces">
                    <View className={inputClass()}>
                      <TextInput
                        value={value}
                        onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                        placeholder="10"
                        placeholderTextColor={PLACEHOLDER_COLOR}
                        keyboardType="number-pad"
                        accessibilityLabel="Pieces per bundle"
                        className={INPUT_TEXT_CLASS}
                      />
                    </View>
                  </Field>
                )}
              />
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View>
        <StyledText variant="semibold" className="text-ink-700 text-sm mb-1.5">
          Quick markup
        </StyledText>
        <View className="flex-row gap-x-2">
          {MARKUP_PRESETS.map((preset) => {
            const target = (parsedCost * (1 + preset)).toFixed(2);
            const active = parsedCost > 0 && price === target;
            return (
              <Pressable
                key={preset}
                disabled={parsedCost <= 0}
                onPress={() => setValue('price', target, dirty)}
                accessibilityRole="button"
                accessibilityLabel={`Set price to cost plus ${preset * 100} percent`}
                accessibilityState={{ disabled: parsedCost <= 0, selected: active }}
                className={`flex-1 min-h-[44px] rounded-xl border items-center justify-center ${
                  active
                    ? 'bg-persimmon-600 border-persimmon-600'
                    : 'bg-paper-100 border-paper-300 active:bg-paper-200'
                } ${parsedCost <= 0 ? 'opacity-40' : ''}`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-sm ${active ? 'text-paper-50' : 'text-ink-900'}`}
                >
                  {`+${preset * 100}%`}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
        {parsedCost <= 0 ? (
          <StyledText variant="regular" className="text-ink-500 text-xs mt-1.5">
            Enter a cost to use these.
          </StyledText>
        ) : null}
      </View>

      <Controller
        control={control}
        name="price"
        rules={{
          validate: (v) => tryParsePesosInput(v) > 0 || 'Enter a selling price above ₱0',
        }}
        render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
          <Field label="Selling price per piece" required error={error?.message}>
            <PesoInput
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              label="Selling price per piece, required"
              inputRef={(el) => {
                // RHF focuses this on a failed save; the add flow also focuses it after a scan.
                ref(el);
                if (priceInputRef) priceInputRef.current = el;
              }}
              large
              error={!!error}
            />
          </Field>
        )}
      />

      {parsedCost > 0 && parsedPrice > 0 ? (
        <View
          accessibilityRole="summary"
          accessibilityLabel={`${isLoss ? 'Loss' : 'Profit'} ${formatPesos(Math.abs(profit))} per piece, markup ${markup.toFixed(1)} percent`}
          className={`rounded-xl border px-4 py-3 flex-row items-center ${
            isLoss ? 'bg-semantic-danger-50 border-semantic-danger-100' : 'bg-sage-50 border-sage-100'
          }`}
        >
          <FontAwesome
            name={isLoss ? 'exclamation-triangle' : 'line-chart'}
            size={16}
            color={isLoss ? '#C13030' : '#3D5E1B'}
          />
          <View className="flex-1 ml-3">
            <StyledText variant="medium" className={`text-xs ${isLoss ? 'text-semantic-danger' : 'text-sage-700'}`}>
              {isLoss ? 'Selling at or below cost' : 'Profit per piece (tubo)'}
            </StyledText>
            <StyledText
              variant="extrabold"
              className={`text-xl ${isLoss ? 'text-semantic-danger' : 'text-sage-700'}`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatPesos(profit)}
            </StyledText>
          </View>
          <View className="items-end">
            <StyledText variant="medium" className={`text-xs ${isLoss ? 'text-semantic-danger' : 'text-sage-700'}`}>
              Markup
            </StyledText>
            <StyledText
              variant="extrabold"
              className={`text-xl ${isLoss ? 'text-semantic-danger' : 'text-sage-700'}`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {`${markup.toFixed(1)}%`}
            </StyledText>
          </View>
        </View>
      ) : null}

      <View className="h-px bg-paper-300" />

      <ToggleRow
        label="Sell by case (pakyaw)"
        hint="Bulk price for suki and resellers"
        value={!!enableWholesale}
        onChange={(next) => setValue('enableWholesale', next, dirty)}
      />

      {enableWholesale ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <WholesaleFields control={control} retailPrice={parsedPrice} onPressScanCase={onPressScanCase} />
        </Animated.View>
      ) : null}
    </SectionCard>
  );
}

function WholesaleFields({
  control,
  retailPrice,
  onPressScanCase,
}: {
  control: Control<ProductFormData>;
  retailPrice: number;
  onPressScanCase: () => void;
}) {
  const [retailUnit, caseUnit, factor, casePrice] = useWatch({
    control,
    name: ['retailUnitName', 'wholesaleUnitName', 'conversionFactor', 'wholesalePrice'],
  });
  const savings = calculateWholesaleSavings(
    retailPrice,
    casePrice ? tryParsePesosInput(casePrice) : 0,
    factor ? parseInt(factor, 10) : 0,
  );

  return (
    <View className="gap-y-4">
      <View className="flex-row gap-x-3">
        <View className="flex-1">
          <UnitField control={control} name="retailUnitName" label="Tingi unit" placeholder="Pc" />
        </View>
        <View className="flex-1">
          <UnitField control={control} name="wholesaleUnitName" label="Case unit" placeholder="Case" />
        </View>
      </View>

      <Controller
        control={control}
        name="conversionFactor"
        rules={{
          // Reads the live toggle because RHF keeps rules after the field unmounts.
          validate: (v, all) =>
            !all.enableWholesale || parseInt(v, 10) >= 2 || 'A case holds at least 2 pieces',
        }}
        render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
          <Field label={`${retailUnit || 'Pc'} per ${caseUnit || 'case'}`} error={error?.message}>
            <View className={inputClass(!!error)}>
              <TextInput
                ref={ref}
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                placeholder="12"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="number-pad"
                accessibilityLabel="Pieces per case"
                className={INPUT_TEXT_CLASS}
              />
            </View>
          </Field>
        )}
      />

      <View className="flex-row gap-x-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="wholesaleCostPrice"
            render={({ field: { value, onChange } }) => (
              <Field label="Case cost">
                <PesoInput value={value} onChange={onChange} label="Case cost price" />
              </Field>
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="wholesalePrice"
            render={({ field: { value, onChange } }) => (
              <Field label="Case price">
                <PesoInput value={value} onChange={onChange} label="Case selling price" />
              </Field>
            )}
          />
        </View>
      </View>

      {savings ? (
        <StyledText variant="medium" className="text-cinnamon-500 text-xs bg-cinnamon-50 rounded-xl px-3 py-2.5">
          {`Works out to ${formatPesos(savings.equivalentRetailPrice)} per ${retailUnit || 'Pc'}, saving the buyer ${formatPesos(savings.savingsPerPiece)} (${savings.savingsPercent}%) each.`}
        </StyledText>
      ) : null}

      <Controller
        control={control}
        name="wholesaleBarcode"
        rules={{
          validate: (v, all) =>
            !all.enableWholesale || !v.trim() || validateBarcode(v).ok || 'Barcodes are 8 to 14 digits',
        }}
        render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
          <Field label="Case barcode" hint="Optional. The code on the outer box." error={error?.message}>
            <View className={`${inputClass(!!error)} pr-1`}>
              <TextInput
                ref={ref}
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                placeholder="Scan or type digits"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="number-pad"
                maxLength={14}
                accessibilityLabel="Case barcode"
                className={`${INPUT_TEXT_CLASS} tracking-wider`}
              />
              <Pressable
                onPress={onPressScanCase}
                accessibilityRole="button"
                accessibilityLabel="Scan case barcode with camera"
                className="min-h-[44px] w-11 rounded-lg bg-paper-50 border border-paper-300 items-center justify-center active:bg-paper-200"
              >
                <FontAwesome name="camera" size={14} color="#C8460F" />
              </Pressable>
            </View>
          </Field>
        )}
      />
    </View>
  );
}

function UnitField({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<ProductFormData>;
  name: 'retailUnitName' | 'wholesaleUnitName';
  label: string;
  placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <Field label={label}>
          <View className={inputClass()}>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={PLACEHOLDER_COLOR}
              autoCapitalize="words"
              accessibilityLabel={label}
              className={INPUT_TEXT_CLASS}
            />
          </View>
        </Field>
      )}
    />
  );
}

function PesoInput({
  value,
  onChange,
  onBlur,
  label,
  editable = true,
  large,
  error,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  label: string;
  editable?: boolean;
  large?: boolean;
  error?: boolean;
  inputRef?: Ref<TextInput> | undefined;
}) {
  return (
    <View className={`${inputClass(error)} ${editable ? '' : 'bg-paper-200'}`}>
      <StyledText variant="extrabold" className={`text-ink-500 mr-2 ${large ? 'text-xl' : 'text-base'}`}>
        ₱
      </StyledText>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
        onBlur={onBlur}
        editable={editable}
        placeholder="0.00"
        placeholderTextColor={PLACEHOLDER_COLOR}
        keyboardType="decimal-pad"
        accessibilityLabel={label}
        className={`flex-1 py-3 text-ink-900 ${large ? 'text-2xl font-semibold' : 'text-base'}`}
        style={{ fontVariant: ['tabular-nums'] }}
      />
    </View>
  );
}
