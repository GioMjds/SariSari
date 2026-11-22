import { useCallback, useEffect, useState } from 'react';
import { Product } from '@/types/products.types';
import { InventoryEventType } from '@/types/inventory.types';
import { useInsertInventory } from '@/hooks/useInventory';
import { AdjustMode, resolveStockChange } from './ledgerMath';

export type AdjustmentSign = 'positive' | 'negative';

interface UseLogTransactionFormOptions {
  onSuccessCallback?: () => void;
  initialType?: InventoryEventType;
}

interface UseLogTransactionFormReturn {
  // Form state
  type: InventoryEventType;
  setType: (t: InventoryEventType) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  note: string;
  setNote: (n: string) => void;
  adjustmentSign: AdjustmentSign;
  setAdjustmentSign: (s: AdjustmentSign) => void;
  adjustMode: AdjustMode;
  setAdjustMode: (m: AdjustMode) => void;
  countedQuantity: number;
  setCountedQuantity: (q: number) => void;
  reason: string | null;
  setReason: (r: string | null) => void;

  unitMode: 'retail' | 'wholesale';
  setUnitMode: (m: 'retail' | 'wholesale') => void;

  // Derived
  currentQuantity: number;
  projectedQuantity: number;
  isValid: boolean;
  isPending: boolean;
  hasError: boolean;

  shakeTrigger: number;

  // Handlers
  submit: () => void;
  reset: () => void;
}

export function useLogTransactionForm(
  product: Product,
  options: UseLogTransactionFormOptions = {},
): UseLogTransactionFormReturn {
  const insertInventory = useInsertInventory();
  const { onSuccessCallback, initialType = 'restock' } = options;

  const [type, setType] = useState<InventoryEventType>(initialType);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [adjustmentSign, setAdjustmentSign] =
    useState<AdjustmentSign>('positive');
  const [adjustMode, setAdjustMode] = useState<AdjustMode>('count');
  const [countedQuantity, setCountedQuantity] = useState(product.quantity);
  const [reason, setReason] = useState<string | null>(null);
  const [unitMode, setUnitMode] = useState<'retail' | 'wholesale'>('retail');

  const [shakeTrigger, setShakeTrigger] = useState(0);

  const currentQuantity = product.quantity;

  const hasWholesale =
    product.conversion_factor != null &&
    product.conversion_factor >= 2 &&
    !!product.wholesale_unit_name;

  const isWholesaleRestock =
    type === 'restock' && unitMode === 'wholesale' && hasWholesale;

  const change = resolveStockChange({
    type,
    current: currentQuantity,
    quantity,
    counted: countedQuantity,
    adjustMode,
    sign: adjustmentSign,
    multiplier: isWholesaleRestock ? product.conversion_factor || 1 : 1,
  });

  const projectedQuantity = change.after;
  const isValid = change.pieces > 0 && projectedQuantity >= 0;

  // ─── Reset on mount / when the product identity changes ─────────

  const reset = useCallback(() => {
    setType(initialType);
    setQuantity(1);
    setNote('');
    setAdjustmentSign('positive');
    setAdjustMode('count');
    setCountedQuantity(product.quantity);
    setReason(null);
    setUnitMode('retail');
    setShakeTrigger(0);
  }, [initialType, product.quantity]);

  useEffect(() => {
    reset();
  }, [product.id, reset]);

  // ─── Submit ─────────────────────────────────────────────────────

  const submit = useCallback(() => {
    if (!isValid || insertInventory.isPending) return;

    const noteParts = [
      isWholesaleRestock
        ? `Restocked ${quantity} ${product.wholesale_unit_name} (${change.pieces} ${product.retail_unit_name || 'Pcs'})`
        : null,
      type === 'adjustment' && adjustMode === 'count'
        ? `Shelf count ${countedQuantity} (was ${currentQuantity})`
        : null,
      type === 'damaged' ? reason : null,
      note.trim() || null,
    ].filter(Boolean);

    insertInventory.mutate(
      {
        product_id: product.id,
        type,
        quantity: change.pieces,
        note: noteParts.length ? noteParts.join(' - ') : null,
        adjustment_sign: type === 'adjustment' ? change.sign : null,
      },
      {
        onSuccess: () => {
          reset();
          onSuccessCallback?.();
        },
        onError: () => {
          setShakeTrigger((prev) => prev + 1);
        },
      },
    );
  }, [
    isValid,
    insertInventory,
    product.id,
    type,
    quantity,
    note,
    reason,
    adjustMode,
    countedQuantity,
    currentQuantity,
    isWholesaleRestock,
    change.pieces,
    change.sign,
    reset,
    onSuccessCallback,
    product.retail_unit_name,
    product.wholesale_unit_name,
  ]);

  return {
    type,
    setType,
    quantity,
    setQuantity,
    note,
    setNote,
    adjustmentSign,
    setAdjustmentSign,
    adjustMode,
    setAdjustMode,
    countedQuantity,
    setCountedQuantity,
    reason,
    setReason,
    unitMode,
    setUnitMode,
    currentQuantity,
    projectedQuantity,
    isValid,
    isPending: insertInventory.isPending,
    hasError: insertInventory.isError,
    shakeTrigger,
    submit,
    reset,
  };
}
