import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks/useProducts';
import { useAdjustStock } from '@/hooks/useStockMutations';
import { Product } from '@/types/products.types';
import { Sheet } from './_shared/sheetChrome';
import { SheetProductCard } from './_shared/SheetProductCard';
import { QuantityStepper } from './_shared/QuantityStepper';
import { SegmentedControl } from './_shared/SegmentedControl';
import { ProductPicker } from './ProductPicker';

type Direction = 'increase' | 'decrease';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number) => void;
  initialProductId: number | null;
}

export function AdjustStockSheet({
  visible,
  onClose,
  onSubmitted,
  initialProductId,
}: Props) {
  const { getAllProductsQuery } = useProducts();
  const adjust = useAdjustStock();
  const products = useMemo(
    () => (getAllProductsQuery.data as Product[]) ?? [],
    [getAllProductsQuery.data],
  );

  const [pickedId, setPickedId] = useState<number | null>(initialProductId);
  const [direction, setDirection] = useState<Direction>('increase');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setPickedId(initialProductId);
      setDirection('increase');
      setQty(1);
      setNote('');
    }
  }, [visible, initialProductId]);

  const product = useMemo(
    () => products.find((p) => p.id === pickedId) ?? null,
    [products, pickedId],
  );

  const newQty = product
    ? direction === 'increase'
      ? product.quantity + qty
      : Math.max(0, product.quantity - qty)
    : 0;

  const wouldGoNegative =
    !!product && direction === 'decrease' && qty > product.quantity;
  const valid = !!product && qty >= 1 && !wouldGoNegative;

  const handleSubmit = () => {
    if (!valid || !product) return;
    adjust.mutate(
      {
        productId: product.id,
        newQty,
        reason: note.trim() || 'Adjustment',
      },
      {
        onSuccess: () => {
          onSubmitted?.(product.id, newQty);
          onClose();
        },
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between">
        <StyledText variant="black" className="text-ink-900 text-base">
          Adjust Stock
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close adjust stock sheet"
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
          selectedId={pickedId}
          onSelect={setPickedId}
        />
      )}

      <View className="gap-y-1">
        <View className="flex-row items-center justify-between">
          <StyledText className="text-ink-500 text-xs">
            ADJUSTMENT DIRECTION
          </StyledText>
          <Pressable
            onPress={() => setDirection('increase')}
            accessibilityRole="button"
            accessibilityLabel="Reset direction to increase"
          >
            <StyledText className="text-persimmon-600 text-xs">
              Reset Type
            </StyledText>
          </Pressable>
        </View>
        <SegmentedControl<Direction>
          value={direction}
          onChange={setDirection}
          options={[
            { label: '+ Increase (+)', value: 'increase' },
            { label: '- Decrease (-)', value: 'decrease' },
          ]}
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">QUANTITY</StyledText>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          {...(product ? { current: product.quantity } : {})}
          sign="auto"
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
          accessibilityLabel="Adjust note"
          placeholder="e.g. recount after audit"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel adjust stock"
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            Cancel
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || adjust.isPending}
          accessibilityRole="button"
          accessibilityLabel="Adjust stock"
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid && !adjust.isPending ? 'bg-cinnamon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-sm ${
              valid && !adjust.isPending ? 'text-paper-50' : 'text-ink-400'
            }`}
          >
            Adjust stock
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
