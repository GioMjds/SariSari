import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProducts, productKeys } from '@/hooks/useProducts';
import { deleteProduct } from '@/database/products';
import { insertInventoryTransaction } from '@/database/inventory';
import { useToastStore } from '@/stores/ToastStore';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';

interface ProductSnapshot {
  id: number;
  quantity: number;
  price: number;
  [k: string]: unknown;
}

interface ProductsCacheCtx {
  previous: ProductSnapshot[] | undefined;
}

const PRODUCTS_KEY = productKeys.list();

function withOptimistic(
  qc: ReturnType<typeof useQueryClient>,
  productId: number,
  patch: (p: ProductSnapshot) => ProductSnapshot,
): ProductsCacheCtx {
  const previous = qc.getQueryData<ProductSnapshot[]>(PRODUCTS_KEY);
  qc.setQueryData<ProductSnapshot[]>(PRODUCTS_KEY, (curr) =>
    (curr ?? []).map((p) => (p.id === productId ? patch(p) : p)),
  );
  return { previous };
}

function rollback(
  qc: ReturnType<typeof useQueryClient>,
  ctx: ProductsCacheCtx | undefined,
) {
  if (ctx?.previous) qc.setQueryData(PRODUCTS_KEY, ctx.previous);
}

function invalidateAll(
  qc: ReturnType<typeof useQueryClient>,
  refetch: () => void,
) {
  qc.invalidateQueries({ queryKey: ['inventory'] });
  qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
  refetch();
}

export function useReceiveStock() {
  const qc = useQueryClient();
  const { getAllProductsQuery } = useProducts();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation<
    void,
    Error,
    {
      productId: number;
      qty: number;
      note?: string;
      unitCost?: number;
      supplierId?: string | null;
    }
  >({
    mutationFn: async ({ productId, qty, note, unitCost, supplierId }) => {
      await insertInventoryTransaction({
        product_id: productId,
        type: 'restock',
        quantity: qty,
        note: note ?? null,
        unit_cost: unitCost ?? null,
        supplier_id: supplierId ?? null,
      });
    },
    onMutate: async ({ productId, qty }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      return withOptimistic(qc, productId, (p) => ({
        ...p,
        quantity: p.quantity + qty,
      }));
    },
    onError: (err, _v, ctx) => {
      rollback(qc, ctx as ProductsCacheCtx | undefined);
      addToast({
        message: err.message || 'Failed to receive stock',
        variant: 'danger',
        duration: 5000,
      });
    },
    onSuccess: (_d, { qty }) => {
      addToast({
        message: `Received ${qty} units`,
        variant: 'success',
        duration: 4000,
      });
      invalidateAll(qc, () => getAllProductsQuery.refetch?.());
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  const { getAllProductsQuery } = useProducts();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation<
    void,
    Error,
    { productId: number; newQty: number; reason: string }
  >({
    mutationFn: async ({ productId, newQty, reason }) => {
      const previous = (
        qc.getQueryData<ProductSnapshot[]>(PRODUCTS_KEY) ?? []
      ).find((p) => p.id === productId);
      if (!previous) {
        throw new Error(`Product ${productId} not found in cache`);
      }
      const currentQty = previous.quantity;
      const delta = newQty - currentQty;
      if (delta === 0) return;

      await insertInventoryTransaction({
        product_id: productId,
        type: 'adjustment',
        quantity: Math.abs(delta),
        note: reason,
        adjustment_sign: delta > 0 ? 'positive' : 'negative',
      });
    },
    onMutate: async ({ productId, newQty }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      return withOptimistic(qc, productId, (p) => ({ ...p, quantity: newQty }));
    },
    onError: (err, _v, ctx) => {
      rollback(qc, ctx as ProductsCacheCtx | undefined);
      addToast({
        message: err.message || 'Failed to adjust stock',
        variant: 'danger',
        duration: 5000,
      });
    },
    onSuccess: () => {
      addToast({
        message: 'Stock adjusted',
        variant: 'success',
        duration: 4000,
      });
      invalidateAll(qc, () => getAllProductsQuery.refetch?.());
    },
  });
}

export function useDeleteProducts() {
  const qc = useQueryClient();
  const { getAllProductsQuery } = useProducts();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation<void, Error, number[]>({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await deleteProduct(id);
      }
    },
    onSuccess: (_d, ids) => {
      addToast({
        message: `Deleted ${ids.length} product${ids.length === 1 ? '' : 's'}`,
        variant: 'success',
        duration: 4000,
      });
      invalidateAll(qc, () => getAllProductsQuery.refetch?.());
    },
    onError: (err) => {
      addToast({
        message: err.message || 'Failed to delete',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}

export function useRecordDamaged() {
  const qc = useQueryClient();
  const { getAllProductsQuery } = useProducts();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation<
    void,
    Error,
    { productId: number; qty: number; note?: string }
  >({
    mutationFn: async ({ productId, qty, note }) => {
      await insertInventoryTransaction({
        product_id: productId,
        type: 'damaged',
        quantity: qty,
        note: note ?? null,
      });
    },
    onMutate: async ({ productId, qty }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      return withOptimistic(qc, productId, (p) => ({
        ...p,
        quantity: Math.max(0, p.quantity - qty),
      }));
    },
    onError: (err, _v, ctx) => {
      rollback(qc, ctx as ProductsCacheCtx | undefined);
      addToast({
        message: err.message || 'Failed to mark damaged',
        variant: 'danger',
        duration: 5000,
      });
    },
    onSuccess: (_d, { qty }) => {
      addToast({
        message: `Marked ${qty} as damaged`,
        variant: 'success',
        duration: 4000,
      });
      invalidateAll(qc, () => getAllProductsQuery.refetch?.());
    },
  });
}

export { LOW_STOCK_THRESHOLD };

