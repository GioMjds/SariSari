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
import { AddSalesFormData } from '../add-sales/useAddSalesForm';
import { ProductRow } from './ProductRow';

interface ProductSearchCatalogProps {
  control: Control<AddSalesFormData>;
  filteredProducts: Product[];
  isLoading: boolean;
  getCartLine: (productId: number) => NewSaleItem | undefined;
  onAdd: (product: Product, selectedUnit?: 'retail' | 'wholesale') => void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onToggleUnit?: (productId: number) => void;
  onPressScan: () => void;
  pendingAddProductBarcode?: string | null;
  onPressAddNewProduct?: () => void;
  onDismissPendingAddProduct?: () => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  onRetryFetchNext?: () => void;
}

export function ProductSearchCatalog({
  control,
  filteredProducts,
  isLoading,
  getCartLine,
  onAdd,
  onUpdateQuantity,
  onToggleUnit,
  onPressScan,
  pendingAddProductBarcode,
  onPressAddNewProduct,
  onDismissPendingAddProduct,
  isFetchingNextPage = false,
  hasNextPage = false,
  onEndReached,
  onRetryFetchNext,
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

      {pendingAddProductBarcode ? (
        <View className="mx-4 mb-3 bg-semantic-danger-50 border border-semantic-danger/30 rounded-2xl p-4 shadow-paper">
          <View className="flex-row items-start">
            <View className="w-9 h-9 rounded-full bg-semantic-danger/15 items-center justify-center mr-3">
              <FontAwesome name="barcode" size={16} color="#C22D2D" />
            </View>
            <View className="flex-1">
              <StyledText variant="extrabold" className="text-ink-900 text-sm">
                Not in inventory
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-700 text-xs mt-1"
              >
                {pendingAddProductBarcode}
              </StyledText>
            </View>
            {onDismissPendingAddProduct ? (
              <Pressable
                onPress={onDismissPendingAddProduct}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Dismiss not in inventory card"
                className="active:opacity-50"
              >
                <FontAwesome name="times" size={16} color="#623418" />
              </Pressable>
            ) : null}
          </View>
          {onPressAddNewProduct ? (
            <Pressable
              onPress={onPressAddNewProduct}
              accessibilityRole="button"
              accessibilityLabel="Add as new product from scanned barcode"
              className="press-scale mt-3 rounded-xl py-2.5 bg-persimmon-500 shadow-persimmon-glow items-center"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Add as new product
              </StyledText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Products List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#623418" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 82 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (!isFetchingNextPage && hasNextPage && onEndReached) {
              onEndReached();
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              cartLine={getCartLine(item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
              {...(onToggleUnit ? { onToggleUnit } : {})}
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
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#623418" />
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs mt-2"
                >
                  Loading more...
                </StyledText>
              </View>
            ) : !hasNextPage && filteredProducts.length > 0 ? (
              <View className="items-center py-4">
                <StyledText variant="medium" className="text-ink-500 text-xs">
                  End of list
                </StyledText>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
