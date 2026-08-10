import { View, Modal, Pressable, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { ParkedCart } from '@/database/parkedCarts';

interface ParkedCartsListModalProps {
  visible: boolean;
  parkedCarts: ParkedCart[];
  onClose: () => void;
  onResume: (cart: ParkedCart) => void;
  onDiscard: (id: number) => void;
}

export function ParkedCartsListModal({
  visible,
  parkedCarts,
  onClose,
  onResume,
  onDiscard,
}: ParkedCartsListModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-paper-100 rounded-t-3xl p-5 max-h-[80%] shadow-2xl border-t border-paper-300">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center space-x-2 gap-2">
              <StyledText variant="extrabold" className="text-xl text-ink-900">
                Parked Carts
              </StyledText>
              <View className="bg-cinnamon-100 px-2.5 py-0.5 rounded-full border border-cinnamon-200">
                <StyledText variant="extrabold" className="text-xs text-cinnamon-800">
                  {parkedCarts.length} / 3
                </StyledText>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close parked carts modal"
              className="w-11 h-11 items-center justify-center rounded-full bg-paper-200 active:bg-paper-300"
            >
              <FontAwesome name="times" size={16} color="#623418" />
            </Pressable>
          </View>

          {parkedCarts.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <FontAwesome
                name="inbox"
                size={48}
                color="#623418"
                style={{ opacity: 0.3 }}
              />
              <StyledText
                variant="semibold"
                className="text-ink-600 text-base mt-3 mb-1"
              >
                No parked carts
              </StyledText>
              <StyledText variant="regular" className="text-ink-500 text-xs text-center">
                Tap &quot;Park&quot; on POS to hold a suki&apos;s cart temporarily.
              </StyledText>
            </View>
          ) : (
            <ScrollView
              className="mb-4"
              showsVerticalScrollIndicator={false}
            >
              {parkedCarts.map((cart) => {
                const itemCount = cart.cartItems.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                const total = cart.cartItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                );

                return (
                  <View
                    key={cart.id}
                    className="bg-paper-50 p-4 rounded-2xl border border-paper-300 shadow-sm flex-row items-center justify-between mb-3"
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center space-x-2 gap-2 mb-1">
                        <StyledText
                          variant="extrabold"
                          className="text-base text-ink-900 flex-1"
                          numberOfLines={1}
                        >
                          {cart.label}
                        </StyledText>
                        <View
                          className={`px-2 py-0.5 rounded-md ${
                            cart.paymentType === 'credit'
                              ? 'bg-amber-100 border border-amber-200'
                              : 'bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <StyledText
                            variant="extrabold"
                            className={`text-xs ${
                              cart.paymentType === 'credit'
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            {cart.paymentType === 'credit' ? 'Utang' : 'Cash'}
                          </StyledText>
                        </View>
                      </View>

                      <StyledText variant="semibold" className="text-sm text-cinnamon-700">
                        {formatPesos(total)} • {itemCount}{' '}
                        {itemCount === 1 ? 'item' : 'items'}
                      </StyledText>
                    </View>

                    <View className="flex-row items-center space-x-2 gap-2">
                      <Pressable
                        onPress={() => onDiscard(cart.id)}
                        className="px-3 py-2 bg-semantic-danger-50 border border-semantic-danger/20 rounded-xl active:bg-semantic-danger-100 min-h-[44px] justify-center items-center"
                      >
                        <StyledText variant="extrabold" className="text-semantic-danger text-xs">
                          Discard
                        </StyledText>
                      </Pressable>
                      <Pressable
                        onPress={() => onResume(cart)}
                        className="px-4 py-2 bg-cinnamon-500 rounded-xl active:bg-cinnamon-600 min-h-[44px] justify-center items-center shadow-persimmon-glow"
                      >
                        <StyledText variant="extrabold" className="text-paper-50 text-xs">
                          Resume
                        </StyledText>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
