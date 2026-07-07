import { FontAwesome } from '@expo/vector-icons';
import {
  FlatList,
  Modal as RNModal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Product } from '@/types';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';

interface ProductPickerProps {
  /** Current value of the `productName` form field. */
  value: string;
  /** Filtered suggestion list, pre-computed by the parent hook. */
  suggestions: Product[];
  /** Currently locked product (set when the user picks a suggestion). */
  selectedProduct: Product | null;
  /** Whether the suggestion list is currently expanded. */
  dropdownOpen: boolean;
  /** Called when the suggestion list should open or close. */
  onDropdownOpenChange: (open: boolean) => void;
  /** Called whenever the user types in the search input. */
  onChangeText: (text: string) => void;
  /** Called when the user picks a suggestion. */
  onSelect: (product: Product) => void;
  /** Called when the user clears the search via the X button. */
  onClear: () => void;
}

/**
 * ProductPicker — searchable autocomplete dropdown.
 *
 * The visible field is a single tap target styled like a native
 * dropdown (`<Select>`) trigger — not a search bar. The label,
 * chevron, and locked-product preview all sit inside it. Tapping
 * the field opens a bottom-sheet-style modal that contains the
 * search input and the suggestion list.
 */
export function ProductPicker({
  value,
  suggestions,
  selectedProduct,
  dropdownOpen,
  onDropdownOpenChange,
  onChangeText,
  onSelect,
  onClear,
}: ProductPickerProps) {
  return (
    <View>
      <StyledText variant="black" className="label-caps text-ink-700">
        Product Name
      </StyledText>

      <Pressable
        onPress={() => onDropdownOpenChange(true)}
        accessibilityRole="button"
        accessibilityLabel={
          selectedProduct
            ? `Selected item ${selectedProduct.name}. Tap to change.`
            : 'Tap to choose an item'
        }
        className="mt-2 rounded-xl border border-ink-100 px-3 py-3 flex-row items-center"
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#EFE6D2' : '#F6F0E2',
        })}
      >
        {selectedProduct ? (
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-sm"
              numberOfLines={1}
            >
              {selectedProduct.name}
            </StyledText>
            <StyledText
              variant="medium"
              className="text-ink-500 text-xs mt-0.5"
            >
              {formatPesos(selectedProduct.price)} · tap to change
            </StyledText>
          </View>
        ) : (
          <StyledText variant="medium" className="flex-1 text-ink-400 text-sm">
            {value ? value : 'Tap to choose an item…'}
          </StyledText>
        )}
        <FontAwesome name="chevron-down" size={14} color="#7A7165" />
      </Pressable>

      {/* Manual-edit path: if the user typed something that doesn't
          match a locked product, show a small "clear" affordance so
          they can reset. */}
      {!selectedProduct && value.length > 0 && (
        <Pressable
          key="clear-typed-item"
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear typed item name"
          className="self-start mt-1.5"
        >
          <StyledText
            variant="medium"
            className="text-ink-400 text-xs underline"
          >
            Clear
          </StyledText>
        </Pressable>
      )}

      {/* Low-stock warning stays inline — it's a status pill, not
          an interactive list. */}
      {selectedProduct && selectedProduct.quantity <= 5 && (
        <View
          key="low-stock-warning"
          className="mt-2 flex-row items-center bg-semantic-warning-50 border border-semantic-warning rounded-md px-2.5 py-1.5 self-start"
        >
          <FontAwesome name="exclamation-triangle" size={11} color="#C77B0E" />
          <StyledText
            variant="medium"
            className="text-semantic-warning text-xs ml-1.5"
          >
            Low stock — only {selectedProduct.quantity} left
          </StyledText>
        </View>
      )}

      {/* Dropdown sheet — modal in the form-sheet's own window
          hierarchy. */}
      <RNModal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => onDropdownOpenChange(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          {/* Backdrop — sibling Pressable so taps on the card don't
              fall through to it. */}
          <Pressable
            onPress={() => onDropdownOpenChange(false)}
            accessibilityLabel="Close item dropdown"
            accessibilityRole="button"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          <View
            accessibilityViewIsModal
            className="bg-paper-50 rounded-t-3xl px-4 pt-3 pb-8"
            style={{
              maxHeight: '85%',
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: -6 },
              elevation: 24,
            }}
          >
            {/* Grabber */}
            <View className="items-center mb-2">
              <View className="w-10 h-1.5 rounded-full bg-ink-200" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <StyledText variant="black" className="text-ink-900 text-base">
                Choose an item
              </StyledText>
              <Pressable
                onPress={() => onDropdownOpenChange(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close dropdown"
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <FontAwesome name="times" size={18} color="#7A7165" />
              </Pressable>
            </View>

            {/* Search field inside the sheet */}
            <View className="bg-paper-100 rounded-xl border border-ink-100 flex-row items-center px-3 py-2.5 mb-3">
              <FontAwesome name="search" size={14} color="#7A7165" />
              <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder="Search or type item name…"
                placeholderTextColor="#A89F90"
                accessibilityLabel="Search or type item name"
                className="flex-1 ml-2.5 text-ink-900 text-base"
              />
              {value.length > 0 && (
                <Pressable
                  key="clear-item-search"
                  onPress={onClear}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear item search"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <FontAwesome name="times-circle" size={16} color="#A89F90" />
                </Pressable>
              )}
            </View>

            {/* Suggestion list */}
            {suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                  <View className="border-t border-dashed border-ink-200" />
                )}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onSelect(item);
                      onDropdownOpenChange(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Pick ${item.name}`}
                    className="px-1 py-3 flex-row items-center justify-between"
                    style={({ pressed }) => ({
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      backgroundColor: pressed ? '#F6F0E2' : 'transparent',
                    })}
                  >
                    <View className="flex-1 pr-2">
                      <StyledText
                        variant="extrabold"
                        className="text-ink-900 text-sm"
                        numberOfLines={1}
                      >
                        {item.name}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-ink-500 text-xs mt-0.5"
                      >
                        Stock: {item.quantity}
                      </StyledText>
                    </View>
                    <StyledText
                      variant="extrabold"
                      className="text-ink-900 text-sm"
                    >
                      {formatPesos(item.price)}
                    </StyledText>
                  </Pressable>
                )}
              />
            ) : (
              <View className="py-10 items-center">
                <FontAwesome name="search" size={24} color="#A89F90" />
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-sm mt-2 text-center"
                >
                  {value.trim()
                    ? `No items match "${value.trim()}"`
                    : 'Type a name to search, or close to enter manually'}
                </StyledText>
              </View>
            )}
          </View>
        </View>
      </RNModal>
    </View>
  );
}
