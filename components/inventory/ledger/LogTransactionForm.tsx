import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { Product } from '@/types/products.types';
import { InventoryEventType } from '@/types/inventory.types';
import { useLogTransactionForm } from './useLogTransactionForm';

interface LogTransactionFormProps {
  product: Product;
  visible: boolean;
  onClose: () => void;
  /**
   * Called after a successful mutation. The mutation's own
   * `onSuccess` already invalidates `['products']` and
   * `['inventory']` and toasts `'Stock updated'`, so the screen
   * typically uses this to keep the sheet closed and let TanStack
   * Query refetch the product + transaction list.
   */
  onSuccess?: () => void;
}

/**
 * LogTransactionForm — the slide-up bottom sheet for logging a new
 * inventory transaction directly from the ledger page.
 *
 * Visual + interaction language mirrors
 * `components/inventory/InventoryActionModal.tsx` (same +/- direction
 * toggle, quantity stepper, note input, confirm-button shake on
 * error). The segmented type control now uses a 2×2 grid of full
 * labels with FontAwesome icons instead of abbreviated
 * "Rstk / Sale / Dmg / Adj" — much easier to scan on a phone.
 *
 * Backed by the existing `useLogTransactionForm` hook so this
 * component stays purely presentational.
 */
export function LogTransactionForm({
  product,
  visible,
  onClose,
  onSuccess,
}: LogTransactionFormProps) {
  const form = useLogTransactionForm(product, { onSuccessCallback: onSuccess });

  const titleMap: Record<InventoryEventType, string> = {
    restock: 'Restock Product',
    sale: 'Record Sale',
    damaged: 'Mark Damaged',
    adjustment: 'Adjust Stock',
  };

  const confirmLabels: Record<InventoryEventType, string> = {
    restock: 'Restock',
    sale: 'Record sale',
    damaged: 'Mark damaged',
    adjustment: 'Adjust stock',
  };

  // Re-label confirm button when the user switches type while
  // the sheet is open. The title in the header also follows the
  // selected type.
  const activeTitle = titleMap[form.type];
  const activeConfirmLabel = confirmLabels[form.type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
            disabled={form.isPending}
          />

          <View className="w-full bg-paper-50 rounded-t-2xl p-6 shadow-modal border-t border-ink-100 pb-10">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <StyledText
                variant="extrabold"
                className="text-xl text-ink-900"
              >
                {activeTitle}
              </StyledText>
              <TouchableOpacity
                onPress={onClose}
                disabled={form.isPending}
                accessibilityLabel="Close transaction form"
                accessibilityRole="button"
                className="p-1"
              >
                <FontAwesome name="times" size={20} color="#7A7165" />
              </TouchableOpacity>
            </View>

            {/* Product context block */}
            <View className="bg-paper-100 border border-ink-100 rounded-xl p-4 mb-4">
              <StyledText
                variant="semibold"
                className="text-ink-900 text-base mb-1"
                numberOfLines={1}
              >
                {product.name}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs mb-3"
              >
                SKU: {product.sku}
              </StyledText>
              <View className="flex-row gap-6">
                <View>
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs"
                  >
                    Current Stock
                  </StyledText>
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-lg mt-0.5"
                  >
                    {form.currentQuantity}
                  </StyledText>
                </View>
                <View>
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs"
                  >
                    Price
                  </StyledText>
                  <MoneyText
                    value={product.price}
                    className="text-lg text-ink-900 font-semibold mt-0.5"
                  />
                </View>
              </View>
            </View>

            {/* Type selection / Adjustment direction toggle */}
            {form.type === 'adjustment' ? (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <StyledText
                    variant="medium"
                    className="text-ink-900 text-xs uppercase"
                    style={{ letterSpacing: 0.5 }}
                  >
                    Adjustment Direction
                  </StyledText>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => form.setAdjustmentSign('positive')}
                    accessibilityRole="button"
                    accessibilityLabel="Increase adjustment sign"
                    className={`flex-1 py-3 rounded-xl border items-center justify-center flex-row gap-2 ${
                      form.adjustmentSign === 'positive'
                        ? 'bg-sage-50 border-sage-500'
                        : 'bg-paper-50 border-ink-200'
                    }`}
                  >
                    <FontAwesome
                      name="plus"
                      size={14}
                      color={form.adjustmentSign === 'positive' ? '#2F5C3E' : '#7A7165'}
                    />
                    <StyledText
                      variant="semibold"
                      className={
                        form.adjustmentSign === 'positive'
                          ? 'text-sage-700'
                          : 'text-ink-600'
                      }
                    >
                      Increase (+)
                    </StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => form.setAdjustmentSign('negative')}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease adjustment sign"
                    className={`flex-1 py-3 rounded-xl border items-center justify-center flex-row gap-2 ${
                      form.adjustmentSign === 'negative'
                        ? 'bg-semantic-danger-50 border-semantic-danger'
                        : 'bg-paper-50 border-ink-200'
                    }`}
                  >
                    <FontAwesome
                      name="minus"
                      size={14}
                      color={form.adjustmentSign === 'negative' ? '#C22D2D' : '#7A7165'}
                    />
                    <StyledText
                      variant="semibold"
                      className={
                        form.adjustmentSign === 'negative'
                          ? 'text-semantic-danger'
                          : 'text-ink-600'
                      }
                    >
                      Decrease (−)
                    </StyledText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="mb-4">
                <StyledText
                  variant="medium"
                  className="text-ink-900 mb-2 text-xs uppercase"
                  style={{ letterSpacing: 0.5 }}
                >
                  Type
                </StyledText>
                {/* Segmented control — single row. We deliberately
                    omit the "Sale" type here because sales aren't
                    logged from this form: a cashier running the
                    counter uses the dedicated Sales flow, and any
                    sale-driven stock change is already captured by
                    `insertSale` in the sales module. This form is
                    for inventory-only corrections. */}
                <View className="flex-row gap-2">
                  {(
                    [
                      {
                        type: 'restock' as const,
                        label: 'Restock',
                        icon: 'plus',
                        activeBg: 'bg-sage-500',
                      },
                      {
                        type: 'damaged' as const,
                        label: 'Damaged',
                        icon: 'exclamation-triangle',
                        activeBg: 'bg-semantic-danger',
                      },
                      {
                        type: 'adjustment' as const,
                        label: 'Adjust',
                        icon: 'sliders',
                        activeBg: 'bg-semantic-warning',
                      },
                    ]
                  ).map(({ type: t, label, icon, activeBg }) => {
                    const isActive = form.type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => {
                          form.setType(t);
                          if (t === 'adjustment') form.setAdjustmentSign('positive');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select type ${label}`}
                        accessibilityState={{ selected: isActive }}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border ${
                          isActive
                            ? `${activeBg} border-transparent shadow-sm`
                            : 'bg-paper-50 border-ink-200'
                        }`}
                      >
                        <FontAwesome
                          name={icon as any}
                          size={13}
                          color={isActive ? '#FBF7EE' : '#564E45'}
                        />
                        <StyledText
                          variant="extrabold"
                          className={`text-xs ${
                            isActive ? 'text-paper-50' : 'text-ink-700'
                          }`}
                        >
                          {label}
                        </StyledText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quantity stepper */}
            <View className="mb-4">
              <StyledText
                variant="medium"
                className="text-ink-900 mb-2 text-xs uppercase"
                style={{ letterSpacing: 0.5 }}
              >
                Quantity
              </StyledText>
              <View className="flex-row items-center justify-center gap-4 my-2">
                <TouchableOpacity
                  onPress={() => form.setQuantity(Math.max(1, form.quantity - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                  className="w-12 h-12 rounded-xl bg-ink-50 border border-ink-200 items-center justify-center"
                >
                  <FontAwesome name="minus" size={16} color="#4A2610" />
                </TouchableOpacity>

                <TextInput
                  value={String(form.quantity)}
                  onChangeText={(text) => {
                    const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                    form.setQuantity(Number.isNaN(val) ? 0 : val);
                  }}
                  keyboardType="number-pad"
                  accessibilityLabel="Quantity"
                  className="w-24 text-center text-2xl font-extrabold text-ink-900 border-b border-ink-300 py-1"
                  style={{ fontFamily: 'System' }}
                />

                <TouchableOpacity
                  onPress={() => form.setQuantity(form.quantity + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                  className="w-12 h-12 rounded-xl bg-ink-50 border border-ink-200 items-center justify-center"
                >
                  <FontAwesome name="plus" size={16} color="#4A2610" />
                </TouchableOpacity>
              </View>

              <View
                className="items-center mt-2 mb-2"
                accessibilityLiveRegion="polite"
              >
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs"
                >
                  CURRENT:{' '}
                  <StyledText variant="extrabold" className="text-ink-700">
                    {form.currentQuantity}
                  </StyledText>{' '}
                  → NEW:{' '}
                  <StyledText
                    variant="extrabold"
                    className={
                      form.projectedQuantity < 0
                        ? 'text-semantic-danger'
                        : 'text-persimmon-600'
                    }
                  >
                    {form.projectedQuantity}
                  </StyledText>
                </StyledText>
                {form.projectedQuantity < 0 && (
                  <StyledText
                    variant="semibold"
                    className="text-semantic-danger text-xs mt-1"
                  >
                    Can&apos;t go below zero.
                  </StyledText>
                )}
              </View>
            </View>

            {/* Note input */}
            <View className="mb-6">
              <StyledText
                variant="medium"
                className="text-ink-900 mb-2 text-xs uppercase"
                style={{ letterSpacing: 0.5 }}
              >
                Note (optional)
              </StyledText>
              <TextInput
                placeholder='e.g. "10 from supplier A"'
                value={form.note}
                onChangeText={form.setNote}
                placeholderTextColor="#A1978A"
                accessibilityLabel="Transaction note"
                className="bg-paper-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-sm shadow-sm"
              />
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={form.isPending}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                activeOpacity={0.85}
                className="flex-1 border border-ink-200 bg-paper-50 rounded-xl py-3 items-center justify-center"
              >
                <StyledText variant="medium" className="text-ink-600">
                  Cancel
                </StyledText>
              </TouchableOpacity>
              <MotiView
                key={form.shakeTrigger}
                from={{ translateX: 0 }}
                animate={{
                  translateX:
                    form.shakeTrigger > 0 ? [0, -10, 10, -10, 10, -5, 5, 0] : 0,
                }}
                transition={{ type: 'timing', duration: 350 }}
                className="flex-1"
              >
                <TouchableOpacity
                  onPress={form.submit}
                  disabled={!form.isValid || form.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={activeConfirmLabel}
                  accessibilityState={{ disabled: !form.isValid || form.isPending }}
                  activeOpacity={0.85}
                  className={`w-full rounded-xl py-3 items-center justify-center shadow-persimmon-glow ${
                    form.isValid ? 'bg-persimmon-500' : 'bg-ink-200'
                  }`}
                >
                  {form.isPending ? (
                    <ActivityIndicator size="small" color="#FBF7EE" />
                  ) : (
                    <StyledText
                      variant="semibold"
                      className={
                        form.isValid ? 'text-paper-50' : 'text-ink-500'
                      }
                    >
                      {activeConfirmLabel}
                    </StyledText>
                  )}
                </TouchableOpacity>
              </MotiView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}