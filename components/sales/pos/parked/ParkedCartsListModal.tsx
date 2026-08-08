import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
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
        <View className="bg-paper-100 rounded-t-3xl p-5 max-h-[80%] shadow-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center space-x-2">
              <Text className="text-xl font-bold text-ink-900">
                Parked Carts
              </Text>
              <View className="bg-brand-100 px-2.5 py-0.5 rounded-full">
                <Text className="text-xs font-bold text-brand-700">
                  {parkedCarts.length} / 3
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-ink-500 font-bold text-base">✕</Text>
            </Pressable>
          </View>

          {parkedCarts.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <Text className="text-ink-400 text-base font-medium mb-1">
                No parked carts
              </Text>
              <Text className="text-ink-400 text-xs text-center">
                Tap &quot;Park Cart&quot; on POS to hold a suki&apos;s cart
                temporarily.
              </Text>
            </View>
          ) : (
            <ScrollView
              className="space-y-3 mb-4"
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
                    className="bg-white p-4 rounded-2xl border border-paper-200 shadow-sm flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center space-x-2 mb-1">
                        <Text
                          className="text-base font-bold text-ink-900"
                          numberOfLines={1}
                        >
                          {cart.label}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-md ${
                            cart.paymentType === 'credit'
                              ? 'bg-amber-100'
                              : 'bg-emerald-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              cart.paymentType === 'credit'
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            {cart.paymentType === 'credit' ? 'Utang' : 'Cash'}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-sm font-semibold text-brand-600">
                        {formatPesos(total)} • {itemCount}{' '}
                        {itemCount === 1 ? 'item' : 'items'}
                      </Text>
                    </View>

                    <View className="flex-row items-center space-x-2">
                      <Pressable
                        onPress={() => onDiscard(cart.id)}
                        className="p-2.5 bg-rose-50 rounded-xl active:bg-rose-100"
                      >
                        <Text className="text-rose-600 font-bold text-xs">
                          Discard
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onResume(cart)}
                        className="px-4 py-2.5 bg-brand-600 rounded-xl active:bg-brand-700"
                      >
                        <Text className="text-white font-bold text-xs">
                          Resume
                        </Text>
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
