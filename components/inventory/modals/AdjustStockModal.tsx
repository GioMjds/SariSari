import { useState, useMemo } from 'react';
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
import { useProducts } from '@/hooks/useProducts';
import { useAdjustStock } from '@/hooks/useStockMutations';
import { ProductPicker } from './ProductPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number, reason: string) => void;
}

export function AdjustStockModal({ visible, onClose, onSubmitted }: Props) {
  const { getAllProductsQuery } = useProducts();
  const adjust = useAdjustStock();
  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const [productId, setProductId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('');

  const selected = useMemo(
    () => products.find((p: any) => p.id === productId) ?? null,
    [products, productId],
  );

  const qtyNum = Number(newQty);
  const valid =
    !!selected &&
    Number.isInteger(qtyNum) &&
    qtyNum >= 0 &&
    reason.trim().length > 0;

  const handleSubmit = () => {
    if (!valid || !selected) return;
    adjust.mutate(
      { productId: selected.id, newQty: qtyNum, reason: reason.trim() },
      {
        onSuccess: () => {
          onSubmitted?.(selected.id, qtyNum, reason.trim());
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
            Stock Adjustment
          </StyledText>

          <ProductPicker
            products={products}
            selectedId={productId}
            onSelect={setProductId}
          />

          {selected ? (
            <StyledText className="text-xs text-ink-500">
              Currently {selected.quantity} in stock.
            </StyledText>
          ) : null}

          <View className="gap-y-1">
            <StyledText className="text-xs text-ink-500">
              New quantity
            </StyledText>
            <TextInput
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="number-pad"
              accessibilityLabel="Adjust stock new quantity"
              className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
            />
          </View>

          <View className="gap-y-1">
            <StyledText className="text-xs text-ink-500">
              Reason (required)
            </StyledText>
            <TextInput
              value={reason}
              onChangeText={setReason}
              accessibilityLabel="Adjust stock reason"
              placeholder="Damaged, recount, lost, etc."
              className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
            />
            {reason.length > 0 && reason.trim().length === 0 ? (
              <StyledText className="text-xs text-rose-700">
                Reason cannot be only spaces.
              </StyledText>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityLabel="Adjust stock submit"
            accessibilityState={{ disabled: !valid }}
            className={`min-h-[44px] rounded-xl items-center justify-center flex-row gap-2 ${
              valid ? 'bg-cinnamon-500' : 'bg-paper-300'
            }`}
          >
            <FontAwesome name="sliders" size={14} color="#FFFFFF" />
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              Save Adjustment
            </StyledText>
          </TouchableOpacity>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
