import { memo, useCallback } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';
import { useStocktakeGuard } from '@/hooks/useStocktake';

export interface ProductActionMenuModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onAdjustStock: (id: number) => void;
  onMarkDamaged: (id: number) => void;
  onViewLedger: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProductActionMenuModal({
  visible,
  product,
  onClose,
  onEdit,
  onAdjustStock,
  onMarkDamaged,
  onViewLedger,
  onDelete,
}: ProductActionMenuModalProps) {
  const { isActive: stocktakeActive } = useStocktakeGuard();
  const insets = useSafeAreaInsets();
  const productId = product?.id;

  // Handlers (kept stable)
  const handleMarkDamaged = useCallback(() => {
    if (stocktakeActive || productId == null) return;
    onClose();
    onMarkDamaged(productId);
  }, [stocktakeActive, productId, onClose, onMarkDamaged]);

  const handleAdjustStock = useCallback(() => {
    if (stocktakeActive || productId == null) return;
    onClose();
    onAdjustStock(productId);
  }, [stocktakeActive, productId, onClose, onAdjustStock]);

  const handleViewLedger = useCallback(() => {
    if (productId == null) return;
    onClose();
    onViewLedger(productId);
  }, [productId, onClose, onViewLedger]);

  const handleEdit = useCallback(() => {
    if (productId == null) return;
    onClose();
    onEdit(productId);
  }, [productId, onClose, onEdit]);

  const handleDelete = useCallback(() => {
    if (productId == null) return;
    onClose();
    onDelete(productId);
  }, [productId, onClose, onDelete]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {visible && product ? (
          <View
            style={{
              backgroundColor: '#FCFAF7',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: '#E4DCCF',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-paper-200">
              <View className="flex-1 pr-3">
                <StyledText
                  variant="black"
                  className="text-ink-900 text-base"
                  numberOfLines={1}
                >
                  {product.name}
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs mt-0.5"
                >
                  Select action to perform
                </StyledText>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={`Close actions for ${product.name}`}
                className="min-w-[44px] min-h-[44px] rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
              >
                <FontAwesome name="times" size={16} color="#564E45" />
              </Pressable>
            </View>

            {/* Stock actions */}
            <View className="gap-y-1 mt-2">
              <StocktakeGuardedRow
                icon="ban"
                baseColor="#C22D2D"
                label="Mark Damaged"
                guarded={stocktakeActive}
                onPress={handleMarkDamaged}
              />
              <StocktakeGuardedRow
                icon="sliders"
                baseColor="#564E45"
                label="Adjust Stock"
                guarded={stocktakeActive}
                onPress={handleAdjustStock}
              />
              <ActionRow
                icon="book"
                iconColor="#564E45"
                label="View Ledger"
                onPress={handleViewLedger}
              />
            </View>

            <View className="h-px bg-paper-200 my-2" />

            <ActionRow
              icon="pencil"
              iconColor="#E85A1F"
              label="Edit Product"
              onPress={handleEdit}
            />

            <View className="h-2" />

            <Pressable
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${product.name}`}
              className="min-h-[44px] px-3 rounded-xl flex-row items-center gap-x-3 bg-rose-50 active:bg-rose-100"
            >
              <FontAwesome name="trash" size={16} color="#C22D2D" />
              <StyledText
                variant="extrabold"
                className="text-base text-semantic-danger"
              >
                Delete Product
              </StyledText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

interface StocktakeGuardedRowProps {
  icon: keyof typeof FontAwesome.glyphMap;
  baseColor: string;
  label: string;
  guarded: boolean;
  onPress: () => void;
}

const StocktakeGuardedRow = memo(function StocktakeGuardedRow({
  icon,
  baseColor,
  label,
  guarded,
  onPress,
}: StocktakeGuardedRowProps) {
  return (
    <ActionRow
      icon={icon}
      iconColor={guarded ? '#A1978A' : baseColor}
      label={guarded ? `${label} (Stocktake in progress)` : label}
      disabled={guarded}
      onPress={onPress}
    />
  );
});

interface ActionRowProps {
  icon: keyof typeof FontAwesome.glyphMap;
  iconColor?: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

const ActionRow = memo(function ActionRow({
  icon,
  iconColor = '#564E45',
  label,
  disabled = false,
  onPress,
}: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={disabled ? { opacity: 0.5 } : undefined}
      className="min-h-[44px] px-3 rounded-xl flex-row items-center gap-x-3 active:bg-paper-100"
    >
      <FontAwesome name={icon} size={16} color={iconColor} />
      <StyledText variant="extrabold" className="text-base text-ink-800">
        {label}
      </StyledText>
    </Pressable>
  );
});
