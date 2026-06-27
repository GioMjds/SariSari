import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { NewSaleItem, Product } from '@/types';
import { StyledText } from '@/components/elements';
import { AddSalesFormData } from './useAddSalesForm';
import { ProductRow } from './ProductRow';

interface ProductSearchCatalogProps {
  control: Control<AddSalesFormData>;
  filteredProducts: Product[];
  isLoading: boolean;
  /** Lookup the current cart line for a product, or `undefined`. */
  getCartLine: (productId: number) => NewSaleItem | undefined;
  onAdd: (product: Product) => void;
  /** Delta is +/-1. Decrementing past zero removes the line. */
  onUpdateQuantity: (productId: number, delta: number) => void;
  /** Opens the camera scanner modal — the primary POS scanning entry. */
  onPressScan: () => void;
}

/**
 * ProductSearchCatalog — the search bar + scrollable product list
 * for the POS. Pure presentation: receives the filtered catalog,
 * cart lookup, and handlers via props.
 *
 * Visual language: each row reads as a "resibo stub" — a torn paper
 * receipt pulled off the counter, with perforated top/bottom edges,
 * a monospace SKU stamp, a colored stock dot, and a stamp-style
 * stepper when the item is in the cart. Mirrors `SaleRow` so the
 * resibo book (history) and the POS register feel like the same
 * surface, viewed from different angles.
 *
 * The search field is bound through react-hook-form's `Controller`
 * so it participates in the same plumbing as the rest of the
 * edit-form routes (reset, dispatch, etc.).
 */
export function ProductSearchCatalog({
  control,
  filteredProducts,
  isLoading,
  getCartLine,
  onAdd,
  onUpdateQuantity,
  onPressScan,
}: ProductSearchCatalogProps) {
  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="bg-paper-50 mx-4 mt-2 mb-3 rounded-2xl px-4 py-3 flex-row items-center border border-ink-100 shadow-paper">
        <FontAwesome name="search" size={16} color="#623418" />
        <Controller
          control={control}
          name="search"
          render={({ field: { value, onChange, onBlur } }) => (
            <>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Search products..."
                placeholderTextColor="#7A7165"
                className="flex-1 ml-3 text-ink-900 font-stack-sans-medium"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {value.length > 0 && (
                <Pressable
                  onPress={() => onChange('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  className="active:opacity-50"
                >
                  <FontAwesome name="times-circle" size={16} color="#623418" />
                </Pressable>
              )}
            </>
          )}
        />
        <Pressable
          onPress={onPressScan}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
          className="active:opacity-50 ml-3"
        >
          <FontAwesome name="barcode" size={18} color="#623418" />
        </Pressable>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#623418" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              cartLine={getCartLine(item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <FontAwesome
                name="inbox"
                size={56}
                color="#623418"
                style={{ opacity: 0.25 }}
              />
              <StyledText
                variant="semibold"
                className="text-ink-500 text-base mt-3"
              >
                No products found
              </StyledText>
            </View>
          }
        />
      )}
    </View>
  );
}

