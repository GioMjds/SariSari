import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { useProducts } from '@/hooks/useProducts';
import { useReceiveStock } from '@/hooks/useStockMutations';
import { ProductPicker } from './ProductPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
}

export function ReceiveStockModal({ visible, onClose, onSubmitted }: Props) {
  const { getAllProductsQuery } = useProducts();
  const receive = useReceiveStock();
  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const [productId, setProductId] = useState<number | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  const selected = useMemo(
    () => products.find((p: any) => p.id === productId) ?? null,
    [products, productId],
  );

  const qtyNum = Number(qty);
  const valid = !!selected && Number.isFinite(qtyNum) && qtyNum > 0;

  const handleSubmit = () => {
    if (!valid || !selected) return;
    receive.mutate(
      { productId: selected.id, qty: qtyNum, note: note || undefined },
      {
        onSuccess: () => {
          onSubmitted?.(selected.id, qtyNum);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable onPress={onClose} className="flex-1" />
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          className="bg-paper-50 rounded-t-3xl p-5 border-t border-paper-300 gap-y-4"
        >
          <StyledText variant="extrabold" className="text-base text-ink-900">
            Receive Stock
          </StyledText>

          <ProductPicker
            products={products}
            selectedId={productId}
            onSelect={setProductId}
          />

          {selected ? (
            <View className="flex-row items-center justify-between bg-paper-100 rounded-xl px-3 py-2">
              <StyledText className="text-xs text-ink-500">
                Current cost
              </StyledText>
              <MoneyText
                value={selected.cost_price ?? 0}
                size="sm"
                className="text-ink-900"
              />
            </View>
          ) : null}

          <View className="gap-y-1">
            <StyledText className="text-xs text-ink-500">Quantity</StyledText>
            <TextInput
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              accessibilityLabel="Receive stock quantity"
              placeholder="e.g. 24"
              className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
            />
          </View>

          <View className="gap-y-1">
            <StyledText className="text-xs text-ink-500">
              Note (optional)
            </StyledText>
            <TextInput
              value={note}
              onChangeText={setNote}
              accessibilityLabel="Receive stock note"
              placeholder="Supplier, batch #, etc."
              className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityLabel="Receive stock submit"
            accessibilityState={{ disabled: !valid }}
            className={`min-h-[44px] rounded-xl items-center justify-center flex-row gap-2 ${
              valid ? 'bg-persimmon-500' : 'bg-paper-300'
            }`}
          >
            <FontAwesome name="download" size={14} color="#FFFFFF" />
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              Receive {qtyNum > 0 ? qtyNum : ''}{' '}
              {selected ? `of ${selected.name}` : ''}
            </StyledText>
          </TouchableOpacity>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
