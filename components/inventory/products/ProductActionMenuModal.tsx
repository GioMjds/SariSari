import {
  Modal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  const stocktakeGuard = useStocktakeGuard();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable
          onPress={onClose}
          className="flex-1"
          accessibilityLabel="Close menu"
        />
        {visible && product ? (
          <View className="bg-paper-50 rounded-t-2xl p-5 border-t border-paper-300">
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
              <ActionRow
                icon="ban"
                iconColor={stocktakeGuard.isActive ? '#A1978A' : '#C22D2D'}
                label={
                  stocktakeGuard.isActive
                    ? 'Mark Damaged (Stocktake in progress)'
                    : 'Mark Damaged'
                }
                disabled={stocktakeGuard.isActive}
                onPress={() => {
                  if (stocktakeGuard.isActive) return;
                  onClose();
                  onMarkDamaged(product.id);
                }}
              />
              <ActionRow
                icon="sliders"
                iconColor={stocktakeGuard.isActive ? '#A1978A' : '#564E45'}
                label={
                  stocktakeGuard.isActive
                    ? 'Adjust Stock (Stocktake in progress)'
                    : 'Adjust Stock'
                }
                disabled={stocktakeGuard.isActive}
                onPress={() => {
                  if (stocktakeGuard.isActive) return;
                  onClose();
                  onAdjustStock(product.id);
                }}
              />
              <ActionRow
                icon="book"
                iconColor="#564E45"
                label="View Ledger"
                onPress={() => {
                  onClose();
                  onViewLedger(product.id);
                }}
              />
            </View>

            <View className="h-px bg-paper-200 my-2" />

            {/* Edit */}
            <ActionRow
              icon="pencil"
              iconColor="#E85A1F"
              label="Edit Product"
              onPress={() => {
                onClose();
                onEdit(product.id);
              }}
            />

            <View className="h-2" />

            {/* Delete (separated, red) */}
            <Pressable
              onPress={() => {
                onClose();
                onDelete(product.id);
              }}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ActionRowProps {
  icon: keyof typeof FontAwesome.glyphMap;
  iconColor?: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function ActionRow({
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
      className="min-h-[44px] px-3 rounded-xl flex-row items-center gap-x-3 active:bg-paper-100"
    >
      <FontAwesome name={icon} size={16} color={iconColor} />
      <StyledText variant="extrabold" className="text-base text-ink-800">
        {label}
      </StyledText>
    </Pressable>
  );
}
