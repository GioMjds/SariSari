import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/configs/sqlite';
import {
  getParkedCarts,
  parkCart,
  discardParkedCart,
  ParkCartInput,
  ParkedCart,
} from '@/database/parkedCarts';
import { getAllProducts } from '@/database/products';
import type { NewSaleItem, Product } from '@/types';

interface ValidateParkedCartResult {
  items: NewSaleItem[];
  warnings: string[];
}

export const parkedCartKeys = {
  all: ['parked-carts'] as const,
  byId: (id: number) => [...parkedCartKeys.all, id] as const,
};

export function validateParkedCartItems(
  parkedItems: NewSaleItem[],
  currentProducts: Product[],
): ValidateParkedCartResult {
  const warnings: string[] = [];
  const updatedItems: NewSaleItem[] = [];

  for (const item of parkedItems) {
    const product = currentProducts.find((p) => p.id === item.product_id);
    if (!product) {
      warnings.push(
        `${item.product_name} is no longer available and was removed.`,
      );
      continue;
    }

    const currentPrice =
      item.selected_unit === 'wholesale' && product.wholesale_price != null
        ? product.wholesale_price
        : product.price;

    let adjustedQty = item.quantity;
    if (adjustedQty > product.quantity) {
      adjustedQty = Math.max(0, product.quantity);
      if (adjustedQty === 0) {
        warnings.push(`${product.name} is out of stock and was removed.`);
        continue;
      }
      warnings.push(
        `${product.name} stock reduced to ${adjustedQty} based on current inventory.`,
      );
    }

    if (currentPrice !== item.price) {
      warnings.push(`${product.name} price updated to current rate.`);
    }

    updatedItems.push({
      ...item,
      price: currentPrice,
      quantity: adjustedQty,
      stock: product.quantity,
      retail_price: product.price,
      wholesale_price: product.wholesale_price ?? null,
      conversion_factor: product.conversion_factor ?? null,
    });
  }

  return { items: updatedItems, warnings };
}

export function useParkedCarts() {
  const queryClient = useQueryClient();

  const parkedQuery = useQuery<ParkedCart[]>({
    queryKey: parkedCartKeys.all,
    queryFn: () => getParkedCarts(db),
  });

  const parkMutation = useMutation({
    mutationFn: (input: ParkCartInput) => parkCart(db, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkedCartKeys.all });
    },
  });

  const discardMutation = useMutation({
    mutationFn: (id: number) => discardParkedCart(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkedCartKeys.all });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (parkedCart: ParkedCart) => {
      const currentProducts = await getAllProducts();
      const { items, warnings } = validateParkedCartItems(
        parkedCart.cartItems,
        currentProducts,
      );

      // Discard from parked database table
      await discardParkedCart(db, parkedCart.id);

      return {
        cart: parkedCart,
        validatedItems: items,
        warnings,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkedCartKeys.all });
    },
  });

  return {
    parkedCarts: parkedQuery.data ?? [],
    isLoading: parkedQuery.isLoading,
    parkCart: parkMutation.mutateAsync,
    discardCart: discardMutation.mutateAsync,
    resumeCart: resumeMutation.mutateAsync,
    isParkPending: parkMutation.isPending,
  };
}
