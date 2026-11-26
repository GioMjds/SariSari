import { Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { type Control, Controller } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import { validateBarcode } from '@/lib/barcodes/format';
import type { Product } from '@/types/products.types';
import { Field, INPUT_TEXT_CLASS, PLACEHOLDER_COLOR, SectionCard, ToggleRow, inputClass } from './FormPrimitives';
import type { ProductFormData } from './types';

interface ProductCodesSectionProps {
  control: Control<ProductFormData>;
  onPressScan: () => void;
  conflictProduct: Product | null;
  onEditConflict?: (productId: number) => void;
  /** Add mode only; omitted on Edit where the SKU is locked. */
  autoGenerateSku?: boolean;
  onToggleAutoGenerateSku?: (next: boolean) => void;
}

/** Barcode (what the scanner reads) kept apart from SKU (your own shelf code). */
export function ProductCodesSection({
  control,
  onPressScan,
  conflictProduct,
  onEditConflict,
  autoGenerateSku,
  onToggleAutoGenerateSku,
}: ProductCodesSectionProps) {
  const isEdit = onToggleAutoGenerateSku === undefined;

  return (
    <SectionCard title="Barcode & SKU" hint="Scan the code printed on the pack">
      <Controller
        control={control}
        name="barcode"
        rules={{
          validate: (v) =>
            !v.trim() || validateBarcode(v).ok || 'Barcodes are 8 to 14 digits',
        }}
        render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
          <Field
            label="Barcode"
            error={error?.message}
            hint={conflictProduct ? undefined : 'Optional. Leave blank for loose items.'}
          >
            <View className={`${inputClass(!!error || !!conflictProduct)} pr-1`}>
              <FontAwesome name="barcode" size={16} color="#564E45" />
              <TextInput
                ref={ref}
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                placeholder="Scan or type digits"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="number-pad"
                maxLength={14}
                accessibilityLabel="Barcode"
                className={`${INPUT_TEXT_CLASS} ml-3 tracking-wider`}
              />
              <Pressable
                onPress={onPressScan}
                accessibilityRole="button"
                accessibilityLabel="Scan barcode with camera"
                className="min-h-[44px] px-3 rounded-lg bg-persimmon-600 flex-row items-center active:bg-persimmon-700"
              >
                <FontAwesome name="camera" size={14} color="#FAFAF7" />
                <StyledText variant="semibold" className="text-paper-50 text-sm ml-2">
                  Scan
                </StyledText>
              </Pressable>
            </View>
          </Field>
        )}
      />

      {conflictProduct ? (
        <View
          accessibilityRole="alert"
          className="-mt-2 flex-row items-start bg-semantic-danger-50 border border-semantic-danger-100 rounded-xl px-3 py-2.5"
        >
          <FontAwesome name="exclamation-triangle" size={14} color="#C13030" style={{ marginTop: 2 }} />
          <View className="flex-1 ml-2">
            <StyledText variant="medium" className="text-semantic-danger text-xs">
              {'Already used by '}
              <StyledText variant="extrabold">{conflictProduct.name}</StyledText>
              {'. Clear it or scan a different code.'}
            </StyledText>
            {onEditConflict ? (
              <Pressable
                onPress={() => onEditConflict(conflictProduct.id)}
                accessibilityRole="link"
                className="min-h-[44px] justify-center self-start active:opacity-70"
              >
                <StyledText variant="semibold" className="text-semantic-danger text-xs underline">
                  Open that product
                </StyledText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="h-px bg-paper-300" />

      {isEdit ? (
        <Controller
          control={control}
          name="sku"
          render={({ field: { value } }) => (
            <Field
              label="SKU"
              aside={<FontAwesome name="lock" size={12} color="#7A7165" />}
              hint="Locked so receipts and reports stay linked."
            >
              <View className={`${inputClass()} bg-paper-200`}>
                <StyledText variant="medium" accessibilityLabel={`SKU ${value}, locked`} className="flex-1 py-3 text-ink-600 text-base">
                  {value}
                </StyledText>
              </View>
            </Field>
          )}
        />
      ) : (
        <>
          <ToggleRow
            label="Auto-generate SKU"
            hint="Made from the product name"
            value={!!autoGenerateSku}
            onChange={onToggleAutoGenerateSku}
          />
          <Controller
            control={control}
            name="sku"
            rules={{
              validate: (v) => autoGenerateSku || v.trim().length > 0 || 'Enter a SKU or turn on auto-generate',
            }}
            render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
              <Field
                label="SKU"
                error={error?.message}
                hint={autoGenerateSku ? undefined : 'Your own shelf code, e.g. PC-001. Not the barcode.'}
              >
                <View className={`${inputClass(!!error)} ${autoGenerateSku ? 'bg-paper-200' : ''}`}>
                  <TextInput
                    ref={ref}
                    value={value}
                    onChangeText={(t) => onChange(t.toUpperCase())}
                    onBlur={onBlur}
                    editable={!autoGenerateSku}
                    placeholder={autoGenerateSku ? 'Type a name first' : 'e.g. PC-001'}
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    accessibilityLabel={autoGenerateSku ? 'SKU, auto-generated' : 'SKU'}
                    className={`${INPUT_TEXT_CLASS} ${autoGenerateSku ? 'text-ink-600' : ''}`}
                  />
                </View>
              </Field>
            )}
          />
        </>
      )}
    </SectionCard>
  );
}
