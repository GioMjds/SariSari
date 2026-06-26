import { FontAwesome } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Customer } from '@/types';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface CustomerPickerModalProps {
  visible: boolean;
  customers: Customer[];
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

/**
 * CustomerPickerModal — slide-up bottom modal for picking a suki
 * (customer) during a credit-mode checkout. Mirrors the visual
 * language of the original Sell screen's customer picker: cream
 * sheet, search field at the top, name + outstanding balance per row.
 */
export function CustomerPickerModal({
  visible,
  customers,
  onClose,
  onSelect,
}: CustomerPickerModalProps) {
  const [query, setQuery] = useState<string>('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-paper-50 rounded-t-3xl px-4 pt-5 pb-8 border-t border-ink-100">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <StyledText variant="extrabold" className="text-ink-900 text-xl">
                Select Suki
              </StyledText>
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mt-0.5"
              >
                Credit checkout
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
              placeholder="Search suki..."
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

          {/* Customer List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            style={{ maxHeight: 420 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="py-10 items-center">
                <FontAwesome
                  name="user-o"
                  size={48}
                  color="#B45309"
                  style={{ opacity: 0.3 }}
                />
                <StyledText
                  variant="medium"
                  className="text-warm-600 mt-3"
                >
                  No suki found
                </StyledText>
              </View>
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
    </Modal>
  );
}
