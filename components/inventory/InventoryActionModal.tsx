import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Product, Supplier } from '@/types';
import { InventoryEventType } from '@/types/inventory.types';
import { useInsertInventory } from '@/hooks/useInventory';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SupplierPickerModal } from './SupplierPickerModal';
import { tryParsePesosInput } from '@/lib/money';
import { useTranslation } from 'react-i18next';

interface PendingAction {
  product: Product;
  type: InventoryEventType;
}

interface InventoryActionModalProps {
  pendingAction: PendingAction | null;
  initialQuantity?: number;
  onClose: () => void;
}

export function InventoryActionModal({
  pendingAction,
  initialQuantity = 1,
  onClose,
}: InventoryActionModalProps) {
  const visible = !!pendingAction;

  const { t } = useTranslation('inventory');
  const [selectedType, setSelectedType] = useState<InventoryEventType>('restock');
  const [quantity, setQuantity] = useState(1);
  const [adjustmentSign, setAdjustmentSign] = useState<'positive' | 'negative'>('positive');
  const [note, setNote] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Supplier & Unit Cost state
  const [unitCost, setUnitCost] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  const { getAllSuppliersQuery } = useSuppliers();
  const suppliers = getAllSuppliersQuery.data;

  const insertInventory = useInsertInventory();

  // Reset modal state when product or modal visibility changes
  useEffect(() => {
    if (pendingAction) {
      setSelectedType(pendingAction.type);
      setQuantity(initialQuantity > 0 ? initialQuantity : 1);
      setAdjustmentSign('positive');
      setNote('');
      setShakeTrigger(0);

      // Prefill unitCost and default supplier
      setUnitCost(pendingAction.product.cost_price ? String(pendingAction.product.cost_price) : '');
      if (pendingAction.product.supplier_id && suppliers && suppliers.length > 0) {
        const defaultSupplier = suppliers.find((s) => s.id === pendingAction.product.supplier_id);
        setSelectedSupplier(defaultSupplier || null);
      } else {
        setSelectedSupplier(null);
      }
    }
  }, [pendingAction, initialQuantity, suppliers]);

  if (!pendingAction) return null;

  const currentQuantity = pendingAction.product.quantity;

  // Calculate quantity change based on type and adjustment sign
  let quantityChange = 0;
  if (selectedType === 'restock') {
    quantityChange = quantity;
  } else if (selectedType === 'sale' || selectedType === 'damaged') {
    quantityChange = -quantity;
  } else if (selectedType === 'adjustment') {
    quantityChange = adjustmentSign === 'positive' ? quantity : -quantity;
  }

  const projectedQuantity = currentQuantity + quantityChange;
  const isNegative = projectedQuantity < 0;
  const isValid = quantity > 0 && !isNegative;

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

  const handleConfirm = () => {
    if (!isValid || insertInventory.isPending) return;

    const parsedUnitCost = selectedType === 'restock' && unitCost.trim()
      ? tryParsePesosInput(unitCost)
      : null;

    insertInventory.mutate(
      {
        product_id: pendingAction.product.id,
        type: selectedType,
        quantity,
        note: note.trim() || null,
        adjustment_sign: selectedType === 'adjustment' ? adjustmentSign : null,
        unit_cost: parsedUnitCost,
        supplier_id: selectedType === 'restock' && selectedSupplier ? selectedSupplier.id : null,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: () => {
          setShakeTrigger((prev) => prev + 1);
        },
      }
    );
  };

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
            disabled={insertInventory.isPending}
          />
          <View className="w-full bg-paper-50 rounded-t-2xl p-6 shadow-modal border-t border-ink-100 pb-10">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <StyledText
                variant="extrabold"
                className="text-xl text-ink-900"
              >
                {titleMap[selectedType]}
              </StyledText>
              <TouchableOpacity
                onPress={onClose}
                disabled={insertInventory.isPending}
                className="p-1"
              >
                <FontAwesome name="times" size={20} color="#7A7165" />
              </TouchableOpacity>
            </View>

            {/* Product Info Block */}
            <View className="bg-paper-100 border border-ink-100 rounded-xl p-4 mb-4">
              <StyledText
                variant="semibold"
                className="text-ink-900 text-base mb-1"
              >
                {pendingAction.product.name}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs mb-3"
              >
                SKU: {pendingAction.product.sku}
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
                    {currentQuantity}
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
                    value={pendingAction.product.price}
                    className="text-lg text-ink-900 font-semibold mt-0.5"
                  />
                </View>
              </View>
            </View>

            {/* Type selection / Direction toggle */}
            {selectedType === 'adjustment' ? (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <StyledText variant="medium" className="text-ink-900 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
                    Adjustment Direction
                  </StyledText>
                  <TouchableOpacity onPress={() => setSelectedType(pendingAction.type)}>
                    <StyledText variant="semibold" className="text-persimmon-500 text-xs">
                      Reset Type
                    </StyledText>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setAdjustmentSign('positive')}
                    accessibilityRole="button"
                    accessibilityLabel="Increase adjustment sign"
                    className={`flex-1 py-3 rounded-xl border items-center justify-center flex-row gap-2 ${
                      adjustmentSign === 'positive'
                        ? 'bg-sage-50 border-sage-500'
                        : 'bg-paper-50 border-ink-200'
                    }`}
                  >
                    <FontAwesome name="plus" size={14} color={adjustmentSign === 'positive' ? '#2F5C3E' : '#7A7165'} />
                    <StyledText
                      variant="semibold"
                      className={adjustmentSign === 'positive' ? 'text-sage-700' : 'text-ink-600'}
                    >
                      Increase (+)
                    </StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAdjustmentSign('negative')}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease adjustment sign"
                    className={`flex-1 py-3 rounded-xl border items-center justify-center flex-row gap-2 ${
                      adjustmentSign === 'negative'
                        ? 'bg-semantic-danger-50 border-semantic-danger'
                        : 'bg-paper-50 border-ink-200'
                    }`}
                  >
                    <FontAwesome name="minus" size={14} color={adjustmentSign === 'negative' ? '#C22D2D' : '#7A7165'} />
                    <StyledText
                      variant="semibold"
                      className={adjustmentSign === 'negative' ? 'text-semantic-danger' : 'text-ink-600'}
                    >
                      Decrease (-)
                    </StyledText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="mb-4">
                <StyledText variant="medium" className="text-ink-900 mb-2 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
                  Type
                </StyledText>
                {/* Segmented control — single row. We deliberately
                    omit "Sale" here for the same reason
                    `components/inventory/ledger/LogTransactionForm.tsx`
                    does: sales aren't an inventory concern. The
                    Sales tab and the `app/(edit-forms)/add-sales/`
                    modal own the full sale flow (multi-item cart,
                    customer picking, utang-vs-cash split). Letting
                    this modal also emit sale events would either
                    record stock-only decrements without a resibo or
                    duplicate the sale pipeline — both bad. This
                    form is for inventory-only corrections. */}
                <View className="flex-row border border-ink-200 rounded-xl overflow-hidden bg-paper-50 p-1">
                  {(['restock', 'damaged', 'adjustment'] as const).map((t) => {
                    const isActive = selectedType === t;
                    const labels: Record<string, { label: string; icon: string }> = {
                      restock: { label: 'Restock', icon: '+' },
                      damaged: { label: 'Damaged', icon: '−' },
                      adjustment: { label: 'Adjust', icon: '±' },
                    };
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => {
                          setSelectedType(t);
                          if (t === 'adjustment') setAdjustmentSign('positive');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select type ${t}`}
                        className={`flex-1 py-2 items-center justify-center rounded-lg ${
                          isActive ? 'bg-persimmon-500' : 'bg-transparent'
                        }`}
                      >
                        <StyledText
                          variant="semibold"
                          className={`text-xs ${isActive ? 'text-paper-50' : 'text-ink-600'}`}
                        >
                          {labels[t].icon}
                        </StyledText>
                        <StyledText
                          variant="semibold"
                          className={`text-xs ${isActive ? 'text-paper-50' : 'text-ink-500'}`}
                        >
                          {labels[t].label}
                        </StyledText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quantity Stepper */}
            <View className="mb-4">
              <StyledText variant="medium" className="text-ink-900 mb-2 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
                Quantity
              </StyledText>
              <View className="flex-row items-center justify-center gap-4 my-2">
                <TouchableOpacity
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-xl bg-ink-50 border border-ink-200 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <FontAwesome name="minus" size={16} color="#4A2610" />
                </TouchableOpacity>

                <TextInput
                  value={String(quantity)}
                  onChangeText={(text) => {
                    const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                    setQuantity(Number.isNaN(val) ? 0 : val);
                  }}
                  keyboardType="number-pad"
                  className="w-24 text-center text-2xl font-extrabold text-ink-900 border-b border-ink-300 py-1"
                  style={{ fontFamily: 'System' }}
                />

                <TouchableOpacity
                  onPress={() => setQuantity((q) => q + 1)}
                  className="w-12 h-12 rounded-xl bg-ink-50 border border-ink-200 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <FontAwesome name="plus" size={16} color="#4A2610" />
                </TouchableOpacity>
              </View>

              <View className="items-center mt-2 mb-2" accessibilityLiveRegion="polite">
                <StyledText variant="medium" className="text-ink-500 text-xs">
                  CURRENT: <StyledText variant="extrabold" className="text-ink-700">{currentQuantity}</StyledText> → NEW: <StyledText variant="extrabold" className={isNegative ? 'text-semantic-danger' : 'text-persimmon-600'}>{projectedQuantity}</StyledText>
                </StyledText>
                {isNegative && (
                  <StyledText variant="semibold" className="text-semantic-danger text-xs mt-1">
                    Can&apos;t go below zero.
                  </StyledText>
                )}
              </View>
            </View>

            {selectedType === 'restock' && (
              <View className="mb-4 gap-4">
                {/* Wholesale Unit Cost */}
                <View>
                  <StyledText variant="medium" className="text-ink-900 mb-2 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
                    {t('labelWholesaleCost')}
                  </StyledText>
                  <TextInput
                    placeholder="e.g. 12.50"
                    value={unitCost}
                    onChangeText={setUnitCost}
                    keyboardType="numeric"
                    placeholderTextColor="#A1978A"
                    className="bg-paper-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-sm shadow-sm"
                  />
                </View>

                {/* Supplier Dropdown */}
                <View>
                  <StyledText variant="medium" className="text-ink-900 mb-2 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
                    {t('labelSupplier')}
                  </StyledText>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowSupplierPicker(true)}
                    className="bg-paper-50 border border-ink-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between shadow-sm"
                  >
                    <StyledText
                      variant={selectedSupplier ? 'semibold' : 'regular'}
                      className={selectedSupplier ? 'text-ink-900 text-sm' : 'text-ink-400 text-sm'}
                    >
                      {selectedSupplier ? selectedSupplier.name : t('selectSupplier')}
                    </StyledText>
                    <FontAwesome name="chevron-down" size={14} color="#7A7165" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Note input */}
            <View className="mb-6">
              <StyledText variant="medium" className="text-ink-900 mb-2 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
                Note (optional)
              </StyledText>
              <TextInput
                placeholder='e.g. "10 from supplier A"'
                value={note}
                onChangeText={setNote}
                placeholderTextColor="#A1978A"
                className="bg-paper-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-sm shadow-sm"
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={insertInventory.isPending}
                activeOpacity={0.85}
                className="flex-1 border border-ink-200 bg-paper-50 rounded-xl py-3 items-center justify-center"
              >
                <StyledText variant="medium" className="text-ink-600">
                  Cancel
                </StyledText>
              </TouchableOpacity>
              <MotiView
                key={shakeTrigger}
                from={{ translateX: 0 }}
                animate={{
                  translateX: shakeTrigger > 0 ? [0, -10, 10, -10, 10, -5, 5, 0] : 0,
                }}
                transition={{
                  type: 'timing',
                  duration: 350,
                }}
                className="flex-1"
              >
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={!isValid || insertInventory.isPending}
                  activeOpacity={0.85}
                  className={`w-full rounded-xl py-3 items-center justify-center shadow-persimmon-glow ${
                    isValid ? 'bg-persimmon-500' : 'bg-ink-200'
                  }`}
                >
                  {insertInventory.isPending ? (
                    <ActivityIndicator size="small" color="#FBF7EE" />
                  ) : (
                    <StyledText variant="semibold" className="text-paper-50">
                      {confirmLabels[selectedType]}
                    </StyledText>
                  )}
                </TouchableOpacity>
              </MotiView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SupplierPickerModal
        visible={showSupplierPicker}
        onClose={() => setShowSupplierPicker(false)}
        selectedSupplierId={selectedSupplier ? selectedSupplier.id : null}
        onSelect={(supplier) => setSelectedSupplier(supplier)}
      />
    </Modal>
  );
}
