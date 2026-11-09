import { useMemo } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { costChange, convertDeliveryLine } from '@/lib/deliveryReceipt';
import {
  parseCostInput,
  parseQtyInput,
  type DraftLineForm,
} from '@/lib/deliveryForm';
import { formatPesos } from '@/lib/money';

interface Props {
  form: DraftLineForm;
  onChange: (next: DraftLineForm) => void;
  onRemove: () => void;
}

const isFilledButInvalid = (raw: string, parse: (r: string) => number | null) =>
  raw.trim() !== '' && parse(raw) === null;

export function DeliveryLineRow({ form, onChange, onRemove }: Props) {
  const { t } = useTranslation('receiving');

  const chips = useMemo(() => {
    const expected =
      form.expectedQty.trim() === '' ? 0 : parseQtyInput(form.expectedQty);
    const received = parseQtyInput(form.receivedQty);
    const cost = parseCostInput(form.unitCost);
    if (expected === null || received === null || cost === null) return null;
    try {
      const c = convertDeliveryLine({
        enteredUnit: form.enteredUnit,
        enteredExpectedQty: expected,
        enteredReceivedQty: received,
        enteredUnitCost: cost,
        conversionFactor: form.conversionFactor,
      });
      return {
        shortage: c.shortageQty,
        change: costChange(c.actualUnitCost, form.lastCostPrice),
      };
    } catch {
      return null;
    }
  }, [form]);

  const qtyInvalid =
    isFilledButInvalid(form.expectedQty, parseQtyInput) ||
    isFilledButInvalid(form.receivedQty, parseQtyInput);
  const costInvalid = isFilledButInvalid(form.unitCost, parseCostInput);

  const canUseWholesale =
    form.wholesaleUnitName !== null && (form.conversionFactor ?? 0) >= 2;
  const unitLabel =
    form.enteredUnit === 'wholesale'
      ? (form.wholesaleUnitName ?? t('unitWholesale'))
      : form.retailUnitName;

  const set = (patch: Partial<DraftLineForm>) =>
    onChange({ ...form, ...patch });

  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2 mr-2">
          <StyledText
            variant="semibold"
            className="text-base text-ink-900 flex-shrink"
            numberOfLines={1}
          >
            {form.productName}
          </StyledText>
          {form.newProduct ? (
            <View className="px-2 py-0.5 rounded-full bg-semantic-info-50">
              <StyledText
                variant="semibold"
                className="text-xs text-semantic-info"
              >
                {t('newBadge')}
              </StyledText>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('removeLine')}
          onPress={onRemove}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={14} color="#564E45" />
        </Pressable>
      </View>

      {canUseWholesale ? (
        <View className="mt-2 flex-row gap-2">
          {(['wholesale', 'retail'] as const).map((unit) => {
            const isActive = form.enteredUnit === unit;
            const label =
              unit === 'wholesale'
                ? (form.wholesaleUnitName ?? t('unitWholesale'))
                : form.retailUnitName;
            return (
              <Pressable
                key={unit}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
                onPress={() => set({ enteredUnit: unit })}
                className={`px-3 py-1.5 rounded-full border ${
                  isActive
                    ? 'bg-ink-900 border-ink-900'
                    : 'bg-paper-50 border-ink-200'
                }`}
              >
                <StyledText
                  variant={isActive ? 'extrabold' : 'semibold'}
                  className={`text-xs ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
                >
                  {label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="mt-3 flex-row gap-2">
        <LabeledInput
          label={`${t('expected')} (${unitLabel})`}
          value={form.expectedQty}
          invalid={isFilledButInvalid(form.expectedQty, parseQtyInput)}
          keyboardType="number-pad"
          onChangeText={(v) => set({ expectedQty: v })}
        />
        <LabeledInput
          label={`${t('received')} (${unitLabel})`}
          value={form.receivedQty}
          invalid={isFilledButInvalid(form.receivedQty, parseQtyInput)}
          keyboardType="number-pad"
          onChangeText={(v) => set({ receivedQty: v })}
        />
        <LabeledInput
          label={`${t('unitCost')} / ${unitLabel}`}
          value={form.unitCost}
          invalid={costInvalid}
          keyboardType="decimal-pad"
          onChangeText={(v) => set({ unitCost: v })}
        />
      </View>

      {qtyInvalid ? (
        <StyledText
          variant="medium"
          className="text-semantic-danger text-xs mt-1.5 px-1"
          accessibilityRole="alert"
        >
          {t('errorQtyWhole')}
        </StyledText>
      ) : null}
      {costInvalid ? (
        <StyledText
          variant="medium"
          className="text-semantic-danger text-xs mt-1.5 px-1"
          accessibilityRole="alert"
        >
          {t('errorCostWhole')}
        </StyledText>
      ) : null}

      {chips ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {chips.shortage > 0 ? (
            <View className="px-2 py-0.5 rounded-full bg-semantic-danger-50">
              <StyledText
                variant="semibold"
                className="text-xs text-semantic-danger"
              >
                {t('shortageChip', { count: chips.shortage })}
              </StyledText>
            </View>
          ) : null}
          {chips.change !== null && chips.change > 0 ? (
            <View className="px-2 py-0.5 rounded-full bg-semantic-warning-50">
              <StyledText
                variant="semibold"
                className="text-xs text-semantic-warning"
              >
                {t('costUpChip', { amount: formatPesos(chips.change) })}
              </StyledText>
            </View>
          ) : null}
          {chips.change !== null && chips.change < 0 ? (
            <View className="px-2 py-0.5 rounded-full bg-sage-50">
              <StyledText variant="semibold" className="text-xs text-sage-700">
                {t('costDownChip', {
                  amount: formatPesos(Math.abs(chips.change)),
                })}
              </StyledText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  invalid: boolean;
  keyboardType: 'number-pad' | 'decimal-pad';
  onChangeText: (v: string) => void;
}) {
  return (
    <View className="flex-1">
      <StyledText
        variant="regular"
        className="text-ink-500 text-xs mb-1"
        numberOfLines={1}
      >
        {props.label}
      </StyledText>
      <TextInput
        className={`bg-paper-100 border rounded-xl px-3 py-2.5 text-ink-900 text-sm font-stack-sans ${
          props.invalid ? 'border-semantic-danger' : 'border-ink-200'
        }`}
        keyboardType={props.keyboardType}
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholderTextColor="#A89F90"
      />
    </View>
  );
}
