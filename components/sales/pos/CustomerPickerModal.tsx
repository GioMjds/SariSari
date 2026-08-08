import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Customer } from '@/types';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { useRenderCounter } from '@/hooks/useRenderCounter';
import { logger } from '@/lib/logger';

interface CustomerPickerModalProps {
  visible: boolean;
  customers: Customer[];
  paymentType: 'cash' | 'credit';
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onSelectOneOffName: (name: string) => void;
}

export function CustomerPickerModal({
  visible,
  customers,
  paymentType,
  onClose,
  onSelect,
  onSelectOneOffName,
}: CustomerPickerModalProps) {
  const [query, setQuery] = useState<string>('');

  useRenderCounter('CustomerPickerModal', { feature: 'checkout' });

  const isCash = paymentType === 'cash';
  const trimmedQuery = query.trim();

  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (prevVisibleRef.current !== visible) {
      logger.info(
        {
          event: 'checkout_customer_picker_visibility',
          feature: 'checkout',
          visible,
          paymentType,
          customerCount: customers.length,
        },
        'customer picker visibility changed',
      );
      prevVisibleRef.current = visible;
    }
  }, [visible, paymentType, customers.length]);

  const filtered = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, trimmedQuery]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-paper-50 rounded-t-3xl px-4 pt-5 pb-8 border-t border-ink-100">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-xl"
                >
                  {isCash ? 'Buyer / Suki' : 'Select Suki'}
                </StyledText>
                <StyledText
                  variant="medium"
                  className={`label-caps mt-0.5 ${
                    isCash ? 'text-ink-400' : 'text-semantic-warning'
                  }`}
                >
                  {isCash ? 'Cash checkout · optional' : 'Credit checkout'}
                </StyledText>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close customer picker"
                className="w-9 h-9 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
              >
                <FontAwesome name="times" size={16} color="#0E0C0A" />
              </Pressable>
            </View>

            {/* Search Field */}
            <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mb-3 border border-ink-100">
              <FontAwesome name="search" size={16} color="#B45309" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  isCash ? 'Search suki or type a name…' : 'Search suki...'
                }
                placeholderTextColor="#B45309"
                className="flex-1 ml-3 text-warm-900 font-stack-sans"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  className="active:opacity-50"
                >
                  <FontAwesome name="times-circle" size={16} color="#B45309" />
                </Pressable>
              )}
            </View>

            {trimmedQuery.length > 0 && (
              <Pressable
                onPress={() => onSelectOneOffName(trimmedQuery)}
                accessibilityRole="button"
                accessibilityLabel={`Use ${trimmedQuery} as a one-off buyer name`}
                className="flex-row items-center bg-persimmon-500/10 border border-dashed border-persimmon-500/40 rounded-xl px-4 py-3 mb-3 active:opacity-70"
              >
                <View className="w-7 h-7 rounded-full bg-persimmon-500 items-center justify-center mr-3">
                  <FontAwesome name="plus" size={12} color="#FBF7EE" />
                </View>
                <View className="flex-1">
                  <StyledText
                    variant="extrabold"
                    className="text-persimmon-600 text-sm"
                  >
                    Use &ldquo;{trimmedQuery}&rdquo; as a one-off name
                  </StyledText>
                  <StyledText
                    variant="medium"
                    className="text-ink-500 text-xs mt-0.5"
                  >
                    Saves the name on this resibo only.
                  </StyledText>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#C2410C" />
              </Pressable>
            )}

            {/* Customer List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 420 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                trimmedQuery.length > 0 ? (
                  <View className="py-8 items-center">
                    <FontAwesome
                      name="user-o"
                      size={40}
                      color="#B45309"
                      style={{ opacity: 0.3 }}
                    />
                    <StyledText
                      variant="medium"
                      className="text-warm-600 mt-3 text-center"
                    >
                      No suki matches &ldquo;{trimmedQuery}&rdquo;.
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-ink-500 text-xs mt-1 text-center"
                    >
                      Tap the one-off name action above to record this buyer.
                    </StyledText>
                  </View>
                ) : (
                  <View className="py-10 items-center">
                    <FontAwesome
                      name="user-o"
                      size={48}
                      color="#B45309"
                      style={{ opacity: 0.3 }}
                    />
                    <StyledText variant="medium" className="text-warm-600 mt-3">
                      No suki found
                    </StyledText>
                  </View>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelect(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}`}
                  className="py-3 px-4 rounded-xl mb-2 bg-white border border-ink-100 active:bg-paper-100"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-base"
                  >
                    {item.name}
                  </StyledText>
                  <View className="flex-row items-center justify-between mt-1">
                    <StyledText
                      variant="regular"
                      className="text-warm-600 text-xs"
                    >
                      Outstanding
                    </StyledText>
                    <MoneyText
                      value={item.outstanding_balance}
                      variant={
                        item.outstanding_balance > 0 ? 'danger' : 'default'
                      }
                      size="sm"
                      className={
                        item.outstanding_balance > 0
                          ? 'text-semantic-danger'
                          : 'text-warm-600'
                      }
                    />
                  </View>
                </Pressable>
              )}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
