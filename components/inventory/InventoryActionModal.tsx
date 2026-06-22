import {
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Product } from '@/types';

interface PendingAction {
  product: Product;
  type: 'restock';
}

interface InventoryActionModalProps {
  pendingAction: PendingAction | null;
  quantityInput: string;
  onChangeQuantity: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function InventoryActionModal({
  pendingAction,
  quantityInput,
  onChangeQuantity,
  onSubmit,
  onClose,
  isSubmitting = false,
}: InventoryActionModalProps) {
  const visible = !!pendingAction;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
            disabled={isSubmitting}
          />
          {pendingAction && (
            <View className="w-full bg-paper-50 rounded-t-2xl p-6 shadow-modal border-t border-ink-100 pb-10">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <StyledText
                  variant="extrabold"
                  className="text-xl text-ink-900"
                >
                  Restock Product
                </StyledText>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={isSubmitting}
                  className="p-1"
                >
                  <FontAwesome name="times" size={20} color="#7A7165" />
                </TouchableOpacity>
              </View>

              {/* Product Info Block */}
              <View className="bg-paper-100 border border-ink-100 rounded-xl p-4 mb-4">
                <StyledText
                  variant="semibold"
                  className="text-ink-900 text-base mb-1"
                >
                  {pendingAction.product.name}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs mb-3"
                >
                  SKU: {pendingAction.product.sku}
                </StyledText>
                <View className="flex-row gap-6">
                  <View>
                    <StyledText
                      variant="regular"
                      className="text-ink-500 text-xs"
                    >
                      Current Stock
                    </StyledText>
                    <StyledText
                      variant="semibold"
                      className="text-ink-900 text-lg mt-0.5"
                    >
                      {pendingAction.product.quantity}
                    </StyledText>
                  </View>
                  <View>
                    <StyledText
                      variant="regular"
                      className="text-ink-500 text-xs"
                    >
                      Price
                    </StyledText>
                    <MoneyText
                      value={pendingAction.product.price}
                      fromPesos
                      className="text-lg text-ink-900 font-semibold mt-0.5"
                    />
                  </View>
                </View>
              </View>

              {/* Input field */}
              <View className="mb-6">
                <StyledText
                  variant="medium"
                  className="text-ink-900 mb-2 text-sm"
                >
                  Quantity to Add
                </StyledText>
                <TextInput
                  placeholder="Enter quantity"
                  keyboardType="number-pad"
                  value={quantityInput}
                  onChangeText={onChangeQuantity}
                  editable={!isSubmitting}
                  className="bg-paper-50 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-lg shadow-sm"
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  className="flex-1 border border-ink-200 bg-paper-50 rounded-xl py-3 items-center"
                >
                  <StyledText variant="medium" className="text-ink-600">
                    Cancel
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  className="flex-1 bg-persimmon-500 rounded-xl py-3 items-center justify-center shadow-persimmon-glow"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FBF7EE" />
                  ) : (
                    <StyledText variant="semibold" className="text-paper-50">
                      Confirm
                    </StyledText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
