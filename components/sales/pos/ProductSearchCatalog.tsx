import { useCallback, useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { NewSaleItem, Product } from '@/types';
import { StyledText } from '@/components/elements';
import { ProductRow } from './ProductRow';
import { FastLaneSection } from './FastLaneSection';
import { FastLaneProduct } from '@/database/products';
import { useRenderCounter } from '@/hooks/useRenderCounter';
import { usePOSSearchStore } from '@/stores';

interface ProductSearchCatalogProps {
  filteredProducts: Product[];
  isLoading: boolean;
  getCartLine: (productId: number) => NewSaleItem | undefined;
  onAdd: (
    product: Product,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  onToggleUnit?: (productId: number) => void;
  onPressScan: () => void;
  pendingAddProductBarcode?: string | null;
  onPressAddNewProduct?: () => void;
  onDismissPendingAddProduct?: () => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  onRetryFetchNext?: () => void;
  /**
   * Controlled value for the search input. Parent screens own the
   * state — passing a getter + setter keeps the keystroke re-render
   * out of this catalog tree. Defaults to '' if omitted (e.g. a parent
   * that does not need search).
   */
  searchText?: string | undefined;
  onSearchTextChange?: ((text: string) => void) | undefined;
  parkedCartsCount?: number | undefined;
  cartItemCount?: number | undefined;
  onPressParkedList?: (() => void) | undefined;
  onPressParkCurrent?: (() => void) | undefined;
}

export function ProductSearchCatalog({
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
  searchText,
  onSearchTextChange,
  parkedCartsCount = 0,
  cartItemCount = 0,
  onPressParkedList,
  onPressParkCurrent,
}: ProductSearchCatalogProps) {
  useRenderCounter('ProductSearchCatalog', {
    feature: 'pos_catalog',
    threshold: 10,
    windowMs: 1000,
  });

  const renderProductRow = useCallback(
    ({ item }: { item: Product }) => (
      <ProductRow
        product={item}
        cartLine={getCartLine(item.id)}
        onAdd={onAdd}
        onUpdateQuantity={onUpdateQuantity}
        onToggleUnit={onToggleUnit}
      />
    ),
    [getCartLine, onAdd, onUpdateQuantity, onToggleUnit],
  );

  const handleFastLaneAddToCart = useCallback(
    (product: FastLaneProduct, qty: number) => {
      const existingLine = getCartLine(product.id);
      if (existingLine) {
        onUpdateQuantity(product.id, qty);
      } else {
        onAdd(product as unknown as Product);
        if (qty > 1) {
          onUpdateQuantity(product.id, qty - 1);
        }
      }
    },
    [getCartLine, onAdd, onUpdateQuantity],
  );

  return (
    <View className="flex-1">
      {/* Search Bar — keystroke re-renders are debounced & scoped to this subtree. */}
      <SearchBar
        controlledText={searchText}
        onTextChange={onSearchTextChange}
        onPressScan={onPressScan}
        parkedCartsCount={parkedCartsCount}
        cartItemCount={cartItemCount}
        onPressParkedList={onPressParkedList}
        onPressParkCurrent={onPressParkCurrent}
      />

      {/* Fast Lane Section (with +1, +2, +5 quick-qty chips) */}
      <FastLaneSection onAddToCart={handleFastLaneAddToCart} />

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
                className="w-11 h-11 items-center justify-center active:opacity-50"
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
              className="press-scale mt-3 rounded-xl py-2.5 bg-persimmon-500 shadow-persimmon-glow items-center min-h-[44px] justify-center"
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={11}
          removeClippedSubviews={false}
          onEndReached={() => {
            if (!isFetchingNextPage && hasNextPage && onEndReached) {
              onEndReached();
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={renderProductRow}
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

interface SearchBarProps {
  /**
   * Controlled text from the parent. When omitted, the bar falls back
   * to `usePOSSearchStore` — the production path for the live POS
   * screen, where the parent screen does not own the search state.
   */
  controlledText?: string | undefined;
  onTextChange?: ((text: string) => void) | undefined;
  onPressScan: () => void;
  debounceMs?: number | undefined;
  parkedCartsCount?: number | undefined;
  cartItemCount?: number | undefined;
  onPressParkedList?: (() => void) | undefined;
  onPressParkCurrent?: (() => void) | undefined;
}

/**
 * Isolated, debounced search bar so the catalog tree does not re-render on
 * every keystroke. The bar manages its local state for immediate typing feedback
 * and propagates search query changes after a `debounceMs` delay.
 */
function SearchBar({
  controlledText,
  onTextChange,
  onPressScan,
  debounceMs = 250,
  parkedCartsCount = 0,
  cartItemCount = 0,
  onPressParkedList,
  onPressParkCurrent,
}: SearchBarProps) {
  // Read the store value directly so we render the latest text without
  // re-rendering any ancestor above this component.
  const storedSearchText = usePOSSearchStore((s) => s.searchText);
  const setStoredSearchText = usePOSSearchStore((s) => s.setSearchText);

  const value = controlledText ?? storedSearchText;
  const isControlled = controlledText !== undefined && onTextChange;

  const [localText, setLocalText] = useState(value);

  // Sync external resets / initial values
  useEffect(() => {
    setLocalText(value);
  }, [value]);

  // Debounce propagation of search text to store/parent query handler
  useEffect(() => {
    if (localText === value) return;
    const timer = setTimeout(() => {
      if (isControlled && onTextChange) {
        onTextChange(localText);
      } else {
        setStoredSearchText(localText);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localText, value, isControlled, onTextChange, setStoredSearchText, debounceMs]);

  const handleChangeText = useCallback((text: string) => {
    setLocalText(text);
  }, []);

  const handleClear = useCallback(() => {
    setLocalText('');
    if (isControlled && onTextChange) {
      onTextChange('');
    } else {
      setStoredSearchText('');
    }
  }, [isControlled, onTextChange, setStoredSearchText]);

  return (
    <View className="bg-paper-100 mx-4 mt-2 mb-3 rounded-2xl px-3.5 py-2 flex-row items-center border border-paper-300">
      <FontAwesome name="search" size={16} color="#623418" />
      <TextInput
        value={localText}
        onChangeText={handleChangeText}
        placeholder="Search products..."
        placeholderTextColor="#7A7165"
        className="flex-1 ml-3 text-ink-900 font-stack-sans-medium text-sm py-1.5 min-h-[44px]"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {localText.length > 0 ? (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          className="w-11 h-11 items-center justify-center active:opacity-50"
        >
          <FontAwesome name="times-circle" size={16} color="#623418" />
        </Pressable>
      ) : null}

      {/* Parked Carts Badge Button */}
      {parkedCartsCount > 0 && onPressParkedList ? (
        <Pressable
          onPress={onPressParkedList}
          accessibilityRole="button"
          accessibilityLabel="View parked carts"
          className="bg-cinnamon-100 active:bg-cinnamon-200 px-2.5 h-11 rounded-xl items-center justify-center ml-1.5 flex-row space-x-1"
        >
          <FontAwesome name="inbox" size={14} color="#623418" />
          <StyledText variant="extrabold" className="text-cinnamon-800 text-xs ml-1">
            {parkedCartsCount}
          </StyledText>
        </Pressable>
      ) : null}

      {/* Park Active Cart Action Button */}
      {cartItemCount > 0 && onPressParkCurrent ? (
        <Pressable
          onPress={onPressParkCurrent}
          accessibilityRole="button"
          accessibilityLabel="Park active cart"
          className="bg-paper-300 active:bg-paper-400 px-2.5 h-11 rounded-xl items-center justify-center ml-1.5"
        >
          <StyledText variant="bold" className="text-ink-800 text-xs">
            Park
          </StyledText>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onPressScan}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Scan barcode"
        className="bg-cinnamon-500 active:bg-cinnamon-600 w-11 h-11 rounded-xl items-center justify-center ml-2 min-w-[44px] min-h-[44px]"
      >
        <FontAwesome name="barcode" size={18} color="#FAFAF7" />
      </Pressable>
    </View>
  );
}
