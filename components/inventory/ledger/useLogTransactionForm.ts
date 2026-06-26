import { useCallback, useEffect, useState } from 'react';
import { Product } from '@/types/products.types';
import { InventoryEventType } from '@/types/inventory.types';
import { useInsertInventory } from '@/hooks/useInventory';

export type AdjustmentSign = 'positive' | 'negative';

interface UseLogTransactionFormOptions {
  /**
   * Called after a successful mutation. The mutation's own
   * `onSuccess` already invalidates `['products']` and
   * `['inventory']` and toasts `'Stock updated'`, so the screen
   * typically uses this to close the sheet.
   */
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

/**
 * `useLogTransactionForm(product, options?)` — owns the state and
 * submit pipeline for the in-page "Log Transaction" bottom sheet.
 *
 * The form's `quantity` field is **always a positive integer**; the
 * +/- sign for adjustments is tracked separately as `adjustmentSign`
 * to match the `InventoryActionModal` UX.
 *
 * `isValid` is a UX guard — the underlying
 * `insertInventoryTransaction` in `database/inventory.ts` is the
 * authoritative check (`quantity > 0` + no negative final stock
 * inside `db.withTransactionAsync`).
 */
export function useLogTransactionForm(
  product: Product,
  options: UseLogTransactionFormOptions = {},
): UseLogTransactionFormReturn {
  const insertInventory = useInsertInventory();
  // Destructure the callback up front so the `useCallback` dep array
  // below stays stable across renders (otherwise `options` is a new
  // object on every parent render and `submit` would be re-memoized
  // every time, breaking the consuming component's memoization).
  const { onSuccessCallback } = options;

  const [type, setType] = useState<InventoryEventType>('restock');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [adjustmentSign, setAdjustmentSign] = useState<AdjustmentSign>('positive');

  // Bumping this counter tells <LogTransactionForm> to re-run the
  // shake animation. We don't store the error itself here — the
  // mutation's toast already surfaces the failure to the user.
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // ─── Derived values ─────────────────────────────────────────────

  const currentQuantity = product.quantity;

  let quantityChange = 0;
  if (type === 'restock') {
    quantityChange = quantity;
  } else if (type === 'sale' || type === 'damaged') {
    quantityChange = -quantity;
  } else if (type === 'adjustment') {
    quantityChange = adjustmentSign === 'positive' ? quantity : -quantity;
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
    setShakeTrigger(0);
  }, []);

  useEffect(() => {
    reset();
  }, [product.id, reset]);

  // ─── Submit ─────────────────────────────────────────────────────

  const submit = useCallback(() => {
    if (!isValid || insertInventory.isPending) return;

    insertInventory.mutate(
      {
        product_id: product.id,
        type,
        quantity,
        note: note.trim() || null,
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
    reset,
    onSuccessCallback,
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
