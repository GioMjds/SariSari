import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useReceiveStock } from '@/hooks/useStockMutations';
import { parsePesosInput } from '@/lib/money';
import { Product } from '@/types/products.types';
import { Supplier } from '@/types/suppliers.types';
import { Sheet } from './_shared/sheetChrome';
import { SheetProductCard } from './_shared/SheetProductCard';
import { QuantityStepper } from './_shared/QuantityStepper';
import { ProductPicker } from './ProductPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  initialProductId: Product | null;
}

export function RestockSheet({
  visible,
  onClose,
  onSubmitted,
  initialProductId,
}: Props) {
  const { getAllProductsQuery } = useProducts();
  const { getAllSuppliersQuery } = useSuppliers();
  const receive = useReceiveStock();

  const products = useMemo(
    () => (getAllProductsQuery.data as Product[]) ?? [],
    [getAllProductsQuery.data],
  );

  const suppliers = useMemo(
    () => (getAllSuppliersQuery.data as Supplier[]) ?? [],
    [getAllSuppliersQuery.data],
  );

  const [pickedId, setPickedId] = useState<number | null>(
    initialProductId?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const [unitCostText, setUnitCostText] = useState('');
  const [note, setNote] = useState('');
  const [supplierId, setSupplierId] = useState<string | null>(null);

  // Reset when the sheet re-opens.
  useEffect(() => {
    if (visible) {
      setPickedId(initialProductId?.id ?? null);
      setQty(1);
      setUnitCostText('');
      setNote('');
      setSupplierId(null);
    }
  }, [visible, initialProductId]);

  const product = useMemo(
    () => products.find((p) => p.id === pickedId) ?? null,
    [products, pickedId],
  );

  // Pre-fill wholesale cost and supplier from product on first selection.
  useEffect(() => {
    if (product) {
      if (unitCostText === '') {
        setUnitCostText(String(product.cost_price ?? 0));
      }
      if (supplierId === null && product.supplier_id) {
        setSupplierId(product.supplier_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const unitCost = useMemo(() => {
    try {
      return parsePesosInput(unitCostText || '0');
    } catch {
      return null;
    }
  }, [unitCostText]);

  const valid = !!product && qty >= 1 && unitCost !== null;

  const handleSubmit = () => {
    if (!valid || !product || unitCost === null) return;
    receive.mutate(
      {
        productId: product.id,
        qty,
        unitCost: Number(unitCost),
        ...(note ? { note } : {}),
        ...(supplierId !== null ? { supplierId } : {}),
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
          Restock Product
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close restock sheet"
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
        <StyledText variant="regular" className="text-ink-500 text-xs">
          QUANTITY
        </StyledText>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          {...(product !== null ? { current: product.quantity } : {})}
          sign="+"
          min={1}
        />
      </View>

      <View className="gap-y-1">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          WHOLESALE UNIT COST
        </StyledText>
        <TextInput
          value={unitCostText}
          onChangeText={setUnitCostText}
          keyboardType="decimal-pad"
          accessibilityLabel="Wholesale unit cost"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="gap-y-1">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          SUPPLIER (OPTIONAL)
        </StyledText>
        {suppliers.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <Pressable
              onPress={() => setSupplierId(null)}
              accessibilityRole="button"
              accessibilityLabel="No supplier selected"
              className={`px-3 py-2 rounded-xl border ${
                supplierId === null
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-100 border-paper-300'
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-xs ${
                  supplierId === null ? 'text-paper-50' : 'text-ink-700'
                }`}
              >
                None
              </StyledText>
            </Pressable>
            {suppliers.map((s) => {
              const isActive = supplierId === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSupplierId(s.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select supplier ${s.name}`}
                  className={`px-3 py-2 rounded-xl border ${
                    isActive
                      ? 'bg-cinnamon-500 border-cinnamon-500'
                      : 'bg-paper-100 border-paper-300'
                  }`}
                >
                  <StyledText
                    variant="semibold"
                    className={`text-xs ${
                      isActive ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {s.name}
                  </StyledText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <StyledText variant="regular" className="text-xs text-ink-400 py-1">
            No suppliers found
          </StyledText>
        )}
      </View>

      <View className="gap-y-1">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          NOTE (OPTIONAL)
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Restock note"
          placeholder="e.g. 10 from supplier A"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel restock"
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            Cancel
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || receive.isPending}
          accessibilityRole="button"
          accessibilityLabel="Restock"
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid && !receive.isPending ? 'bg-persimmon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            Restock
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
