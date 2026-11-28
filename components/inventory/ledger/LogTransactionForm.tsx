import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui';
import { Product } from '@/types/products.types';
import { InventoryEventType } from '@/types/inventory.types';
import { useLogTransactionForm } from './useLogTransactionForm';
import { formatDualStock } from '@/lib';
import { useProducts } from '@/hooks/useProducts';
import { ProductPicker, SegmentedControl } from '@/components/inventory/modals';
import { useStocktakeGuard } from '@/hooks';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';

type IconName = keyof typeof FontAwesome.glyphMap;

const titleKey = {
  restock: 'logTitle_restock',
  sale: 'logTitle_sale',
  damaged: 'logTitle_damaged',
  adjustment: 'logTitle_adjustment',
} satisfies Record<InventoryEventType, string>;

const confirmKey = {
  restock: 'logConfirm_restock',
  sale: 'logConfirm_sale',
  damaged: 'logConfirm_damaged',
  adjustment: 'logConfirm_adjustment',
} satisfies Record<InventoryEventType, string>;

const DAMAGE_REASONS = ['expired', 'returned', 'broken', 'lost', 'pests'] as const;

interface StepButtonProps {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function StepButton({ icon, label, disabled, onPress }: StepButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      className={`w-16 h-16 rounded-xl items-center justify-center bg-paper-50 border border-paper-400 active:bg-paper-200 press-scale ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <FontAwesome name={icon} size={18} color="#0E0C0A" />
    </Pressable>
  );
}

interface BigStepperProps {
  value: number;
  min: number;
  label: string;
  onChange: (next: number) => void;
}

function BigStepper({ value, min, label, onChange }: BigStepperProps) {
  const { t: tr } = useTranslation('inventory');
  return (
    <View className="flex-row items-center gap-x-3">
      <StepButton
        icon="minus"
        label={tr('logStepDown')}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      />
      <TextInput
        value={String(value)}
        onChangeText={(text) => {
          const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
          onChange(Number.isNaN(n) ? 0 : n);
        }}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={6}
        accessibilityLabel={label}
        className="flex-1 h-16 rounded-xl bg-paper-100 border border-paper-300 text-center text-h1 text-ink-900"
        style={{ fontFamily: 'StackSansText-Bold' }}
      />
      <StepButton
        icon="plus"
        label={tr('logStepUp')}
        onPress={() => onChange(value + 1)}
      />
    </View>
  );
}

interface StockPreviewProps {
  current: number;
  after: number;
}

// Before/after strip so the owner sees the result before saving.
function StockPreview({ current, after }: StockPreviewProps) {
  const { t: tr } = useTranslation('inventory');
  const delta = after - current;
  const badge =
    delta > 0
      ? { text: `+${delta}`, icon: 'arrow-up' as const, box: 'bg-sage-50 border-sage-200', fg: 'text-sage-700', color: '#2C4413' }
      : delta < 0
        ? { text: `−${-delta}`, icon: 'arrow-down' as const, box: 'bg-semantic-danger-50 border-semantic-danger-100', fg: 'text-semantic-danger', color: '#C13030' }
        : { text: '0', icon: 'minus' as const, box: 'bg-paper-50 border-paper-300', fg: 'text-ink-600', color: '#564E45' };

  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${tr('logNow')} ${current}, ${tr('logAfter')} ${after}`}
      className="flex-row items-center rounded-xl border border-dashed border-paper-400 bg-paper-100 px-4 py-3"
    >
      <View className="flex-1">
        <StyledText variant="medium" className="text-caption text-ink-500">
          {tr('logNow')}
        </StyledText>
        <StyledText variant="extrabold" className="text-h2 text-ink-700">
          {current}
        </StyledText>
      </View>
      <View
        className={`flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-pill border ${badge.box}`}
      >
        <FontAwesome name={badge.icon} size={11} color={badge.color} />
        <StyledText variant="extrabold" className={`text-body ${badge.fg}`}>
          {badge.text}
        </StyledText>
      </View>
      <View className="flex-1 items-end">
        <StyledText variant="medium" className="text-caption text-ink-500">
          {tr('logAfter')}
        </StyledText>
        <StyledText
          variant="extrabold"
          className={`text-h2 ${after < 0 ? 'text-semantic-danger' : 'text-ink-900'}`}
        >
          {after}
        </StyledText>
      </View>
    </View>
  );
}

function FormHint({ tone, text }: { tone: 'danger' | 'muted'; text: string }) {
  const danger = tone === 'danger';
  return (
    <View
      accessibilityRole={danger ? 'alert' : 'text'}
      className="flex-row items-center gap-x-2 -mt-2"
    >
      <FontAwesome
        name={danger ? 'exclamation-circle' : 'check-circle'}
        size={13}
        color={danger ? '#C13030' : '#564E45'}
      />
      <StyledText
        variant="semibold"
        className={`flex-1 text-caption ${danger ? 'text-semantic-danger' : 'text-ink-600'}`}
      >
        {text}
      </StyledText>
    </View>
  );
}

interface LogTransactionBodyProps {
  product: Product;
  initialType: InventoryEventType;
  onClose: () => void;
  onSuccess?: () => void;
}

function LogTransactionBody({
  product,
  initialType,
  onClose,
  onSuccess,
}: LogTransactionBodyProps) {
  const { t: tr } = useTranslation('inventory');
  const stocktakeGuard = useStocktakeGuard();
  const { runWithPinGuard } = useOwnerPinGuard();

  const handleSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose]);

  const form = useLogTransactionForm(product, {
    initialType,
    onSuccessCallback: handleSuccess,
  });

  const handleFormSubmit = () => {
    if (form.type === 'adjustment') {
      runWithPinGuard({
        actionId: 'stock_adjustment',
        title: tr('logPinTitle'),
        actionDescription: tr('logPinBody', { name: product.name }),
        onApproved: () => {
          form.submit();
        },
      });
    } else {
      form.submit();
    }
  };

  if (
    stocktakeGuard.isActive &&
    (form.type === 'adjustment' || form.type === 'damaged')
  ) {
    return (
      <>
        <View className="flex-row gap-x-3 rounded-xl border border-semantic-warning-100 bg-semantic-warning-50 p-4">
          <FontAwesome
            name="pause-circle"
            size={18}
            color="#C77B0E"
            style={{ marginTop: 2 }}
          />
          <View className="flex-1 gap-y-1">
            <StyledText variant="extrabold" className="text-h3 text-ink-900">
              {tr('logBlockedTitle')}
            </StyledText>
            <StyledText variant="regular" className="text-body text-ink-700">
              {tr('logBlockedBody')}
            </StyledText>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="min-h-[52px] rounded-xl items-center justify-center bg-persimmon-500 active:bg-persimmon-700 press-scale"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-[15px]">
            {tr('guideGotIt')}
          </StyledText>
        </Pressable>
      </>
    );
  }

  const isCount = form.type === 'adjustment' && form.adjustMode === 'count';
  const unit = product.retail_unit_name ?? 'Pc';
  const hasWholesale =
    product.conversion_factor != null &&
    product.conversion_factor >= 2 &&
    !!product.wholesale_unit_name;
  const delta = form.projectedQuantity - form.currentQuantity;
  const question = isCount
    ? tr('logCountPrompt')
    : tr(`logHowMany_${form.type}`);
  const notePlaceholder =
    form.type === 'damaged' || form.type === 'adjustment'
      ? tr(`logNotePlaceholder_${form.type}`)
      : tr('logNotePlaceholder');
  const submitLabel = form.isValid
    ? tr(`logSubmit_${form.type}`, {
        qty: Math.abs(delta),
        after: form.projectedQuantity,
      })
    : tr(confirmKey[form.type]);
  const canSubmit = form.isValid && !form.isPending;

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 1 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
      >
        {/* Product context */}
        <View className="gap-y-0.5">
          <StyledText
            variant="extrabold"
            className="text-h3 text-ink-900"
            numberOfLines={2}
          >
            {product.name}
          </StyledText>
          <StyledText variant="regular" className="text-caption text-ink-500">
            {tr('logOnRecord', {
              stock: formatDualStock(
                form.currentQuantity,
                unit,
                product.wholesale_unit_name,
                product.conversion_factor,
              ),
            })}
          </StyledText>
        </View>

        {form.type === 'adjustment' ? (
          <SegmentedControl
            value={form.adjustMode}
            onChange={form.setAdjustMode}
            options={[
              { label: tr('logModeCount'), value: 'count', icon: 'list-ol' },
              { label: tr('logModeDelta'), value: 'delta', icon: 'exchange' },
            ]}
          />
        ) : null}

        {form.type === 'adjustment' && !isCount ? (
          <View className="flex-row gap-x-3">
            {(['positive', 'negative'] as const).map((sign) => {
              const active = form.adjustmentSign === sign;
              const add = sign === 'positive';
              return (
                <Pressable
                  key={sign}
                  onPress={() => form.setAdjustmentSign(sign)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  className={`flex-1 min-h-[48px] rounded-xl border flex-row items-center justify-center gap-x-2 ${
                    active
                      ? add
                        ? 'bg-sage-50 border-sage-500'
                        : 'bg-semantic-danger-50 border-semantic-danger'
                      : 'bg-paper-50 border-paper-400'
                  }`}
                >
                  <FontAwesome
                    name={add ? 'plus' : 'minus'}
                    size={13}
                    color={active ? (add ? '#2C4413' : '#C13030') : '#564E45'}
                  />
                  <StyledText
                    variant="extrabold"
                    className={`text-[15px] ${
                      active
                        ? add
                          ? 'text-sage-700'
                          : 'text-semantic-danger'
                        : 'text-ink-700'
                    }`}
                  >
                    {tr(add ? 'logIncrease' : 'logDecrease')}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {form.type === 'restock' && hasWholesale ? (
          <SegmentedControl
            value={form.unitMode}
            onChange={form.setUnitMode}
            options={[
              { label: `Tingi (${unit})`, value: 'retail' },
              {
                label: `Pakyaw (${product.wholesale_unit_name})`,
                value: 'wholesale',
              },
            ]}
          />
        ) : null}

        <View className="gap-y-2">
          <StyledText variant="semibold" className="text-body text-ink-800">
            {question}
          </StyledText>
          <BigStepper
            value={isCount ? form.countedQuantity : form.quantity}
            min={isCount ? 0 : 1}
            label={question}
            onChange={isCount ? form.setCountedQuantity : form.setQuantity}
          />
        </View>

        <StockPreview
          current={form.currentQuantity}
          after={form.projectedQuantity}
        />
        {form.projectedQuantity < 0 ? (
          <FormHint tone="danger" text={tr('logBelowZero')} />
        ) : isCount && delta === 0 ? (
          <FormHint tone="muted" text={tr('logCountSame')} />
        ) : null}

        {form.type === 'damaged' ? (
          <View className="gap-y-2">
            <StyledText variant="semibold" className="text-body text-ink-800">
              {tr('logReason')}
            </StyledText>
            <View className="flex-row flex-wrap gap-2">
              {DAMAGE_REASONS.map((key) => {
                const label = tr(`logReason_${key}`);
                const active = form.reason === label;
                return (
                  <Pressable
                    key={key}
                    onPress={() => form.setReason(active ? null : label)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    className={`min-h-[44px] px-4 rounded-pill border flex-row items-center gap-x-2 active:opacity-80 ${
                      active
                        ? 'bg-cinnamon-500 border-cinnamon-500'
                        : 'bg-paper-50 border-paper-400'
                    }`}
                  >
                    {active ? (
                      <FontAwesome name="check" size={12} color="#FBF7EE" />
                    ) : null}
                    <StyledText
                      variant="semibold"
                      className={`text-body ${active ? 'text-paper-50' : 'text-ink-700'}`}
                    >
                      {label}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="gap-y-2">
          <StyledText variant="semibold" className="text-body text-ink-800">
            {tr('logNote')}
          </StyledText>
          <TextInput
            placeholder={notePlaceholder}
            value={form.note}
            onChangeText={form.setNote}
            placeholderTextColor="#8A8176"
            accessibilityLabel={tr('logNote')}
            returnKeyType="done"
            className="min-h-[48px] bg-paper-50 border border-paper-400 rounded-xl px-4 py-3 text-ink-900 text-body"
          />
        </View>
      </ScrollView>

      {/* Single primary action stays pinned under the scroll area. */}
      <MotiView
        key={form.shakeTrigger}
        from={{ translateX: 0 }}
        animate={{
          translateX:
            form.shakeTrigger > 0 ? [0, -10, 10, -10, 10, -5, 5, 0] : 0,
        }}
        transition={{ type: 'timing', duration: 350 }}
      >
        <Pressable
          onPress={handleFormSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          accessibilityState={{ disabled: !canSubmit, busy: form.isPending }}
          // Keep `active:` constant; toggling pseudo-classes after mount crashes css-interop.
          className={`min-h-[52px] rounded-xl flex-row items-center justify-center gap-x-2 press-scale active:opacity-80 ${
            form.isValid ? 'bg-persimmon-500' : 'bg-paper-300'
          }`}
        >
          {form.isPending ? (
            <ActivityIndicator size="small" color="#FBF7EE" />
          ) : (
            <>
              {form.type === 'adjustment' ? (
                <FontAwesome
                  name="lock"
                  size={14}
                  color={form.isValid ? '#FBF7EE' : '#736B63'}
                />
              ) : null}
              <StyledText
                variant="extrabold"
                className={`text-[15px] ${form.isValid ? 'text-paper-50' : 'text-ink-500'}`}
              >
                {submitLabel}
              </StyledText>
            </>
          )}
        </Pressable>
      </MotiView>
    </>
  );
}

interface LogTransactionFormProps {
  product?: Product | null;
  initialType?: InventoryEventType;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LogTransactionForm({
  product,
  initialType = 'restock',
  visible,
  onClose,
  onSuccess,
}: LogTransactionFormProps) {
  const { t: tr } = useTranslation('inventory');
  const { getAllProductsQuery } = useProducts();
  const products = getAllProductsQuery.data ?? [];
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [lastShown, setLastShown] = useState<Product | null>(null);

  const locked = product ?? pickedProduct;

  useEffect(() => {
    if (!visible) setPickedProduct(null);
  }, [visible]);

  useEffect(() => {
    if (locked) setLastShown(locked);
  }, [locked]);

  // Keep the last product on screen while the sheet slides out.
  const shown = locked ?? (visible ? null : lastShown);

  return (
    <Sheet visible={visible} onClose={onClose} title={tr(titleKey[initialType])}>
      {shown ? (
        <LogTransactionBody
          key={shown.id}
          product={shown}
          initialType={initialType}
          onClose={onClose}
          {...(onSuccess ? { onSuccess } : {})}
        />
      ) : (
        <ProductPicker
          products={products}
          selectedId={null}
          onSelect={(id) =>
            setPickedProduct(products.find((x) => x.id === id) ?? null)
          }
        />
      )}
    </Sheet>
  );
}
