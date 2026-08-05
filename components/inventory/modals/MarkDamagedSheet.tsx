import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks/useProducts';
import { useRecordDamaged } from '@/hooks/useStockMutations';
import { Product } from '@/types/products.types';
import { Sheet } from './_shared/sheetChrome';
import { SheetProductCard } from './_shared/SheetProductCard';
import { QuantityStepper } from './_shared/QuantityStepper';
import { ProductPicker } from './ProductPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  lockedProduct: Product | null;
}

export function MarkDamagedSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
  const { getAllProductsQuery } = useProducts();
  const damaged = useRecordDamaged();
  const products = useMemo(
    () => (getAllProductsQuery.data as Product[]) ?? [],
    [getAllProductsQuery.data],
  );

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setQty(1);
      setNote('');
    }
  }, [visible]);

  const product = lockedProduct;

  const wouldGoNegative = !!product && qty > product.quantity;
  const valid = !!product && qty >= 1 && !wouldGoNegative;

  const handleSubmit = () => {
    if (!valid || !product) return;
    damaged.mutate(
      {
        productId: product.id,
        qty,
        ...(note ? { note } : {}),
      },
      {
        onSuccess: () => {
          onSubmitted?.(product.id, qty);
          onClose();
        },
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between">
        <StyledText variant="black" className="text-ink-900 text-base">
          Mark Damaged
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close mark-damaged sheet"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      {product ? (
        <SheetProductCard product={product} />
      ) : (
        <ProductPicker
          products={products}
          selectedId={null}
          onSelect={() => {}}
        />
      )}

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">QUANTITY</StyledText>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          {...(product ? { current: product.quantity } : {})}
          sign="-"
          min={1}
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">
          NOTE (OPTIONAL)
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Damaged note"
          placeholder="e.g. wet box from delivery"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel mark damaged"
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            Cancel
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || damaged.isPending}
          accessibilityRole="button"
          accessibilityLabel="Mark damaged"
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid && !damaged.isPending ? 'bg-persimmon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-sm ${
              valid && !damaged.isPending ? 'text-paper-50' : 'text-ink-400'
            }`}
          >
            Mark damaged
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
