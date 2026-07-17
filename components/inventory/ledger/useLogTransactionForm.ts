import { useCallback, useEffect, useState } from 'react';
import { Product } from '@/types/products.types';
import { InventoryEventType } from '@/types/inventory.types';
import { useInsertInventory } from '@/hooks/useInventory';

export type AdjustmentSign = 'positive' | 'negative';

interface UseLogTransactionFormOptions {
  onSuccessCallback?: () => void;
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

  unitMode: 'retail' | 'wholesale';
  setUnitMode: (m: 'retail' | 'wholesale') => void;

  // Derived
  currentQuantity: number;
  projectedQuantity: number;
  isValid: boolean;
  isPending: boolean;
  hasError: boolean;
  /** Bump the counter so <LogTransactionForm> can re-trigger its shake. */
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
  const { onSuccessCallback } = options;

  const [type, setType] = useState<InventoryEventType>('restock');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [adjustmentSign, setAdjustmentSign] =
    useState<AdjustmentSign>('positive');
  const [unitMode, setUnitMode] = useState<'retail' | 'wholesale'>('retail');

  const [shakeTrigger, setShakeTrigger] = useState(0);

  // ─── Derived values ─────────────────────────────────────────────

  const currentQuantity = product.quantity;

  const hasWholesale =
    product.conversion_factor != null &&
    product.conversion_factor >= 2 &&
    !!product.wholesale_unit_name;

  const actualPieces =
    type === 'restock' && unitMode === 'wholesale' && hasWholesale
      ? quantity * (product.conversion_factor || 1)
      : quantity;

  let quantityChange = 0;
  if (type === 'restock') {
    quantityChange = actualPieces;
  } else if (type === 'sale' || type === 'damaged') {
    quantityChange = -actualPieces;
  } else if (type === 'adjustment') {
    quantityChange =
      adjustmentSign === 'positive' ? actualPieces : -actualPieces;
  }

  const projectedQuantity = currentQuantity + quantityChange;
  const isNegative = projectedQuantity < 0;
  const isValid = quantity > 0 && !isNegative;

  // ─── Reset on mount / when the product identity changes ─────────

  const reset = useCallback(() => {
    setType('restock');
    setQuantity(1);
    setNote('');
    setAdjustmentSign('positive');
    setUnitMode('retail');
    setShakeTrigger(0);
  }, []);

  useEffect(() => {
    reset();
  }, [product.id, reset]);

  // ─── Submit ─────────────────────────────────────────────────────

  const submit = useCallback(() => {
    if (!isValid || insertInventory.isPending) return;

    const isWholesaleRestock =
      type === 'restock' && unitMode === 'wholesale' && hasWholesale;

    const autoNote = isWholesaleRestock
      ? `Restocked ${quantity} ${product.wholesale_unit_name} (${actualPieces} ${product.retail_unit_name || 'Pcs'})${
          note.trim() ? ' - ' + note.trim() : ''
        }`
      : note.trim() || null;

    insertInventory.mutate(
      {
        product_id: product.id,
        type,
        quantity: actualPieces,
        note: autoNote,
        adjustment_sign: type === 'adjustment' ? adjustmentSign : null,
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
    adjustmentSign,
    unitMode,
    hasWholesale,
    actualPieces,
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
