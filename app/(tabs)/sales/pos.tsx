import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  ProductSearchCatalog,
  CustomerPickerModal,
  FloatingCheckoutButton,
  CheckoutModal,
} from '@/components/sales/pos';
import { BarcodeScannerModal } from '@/components/ui';
import { useCart } from '@/components/sales/pos/useCart';
import { usePOSSearchStore } from '@/stores';
import { usePaginatedProducts } from '@/hooks';

export default function POSScreen() {
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Search text lives in `usePOSSearchStore`. This screen subscribes
  // only to `setSearchText` (a stable Zustand action ref), so a
  // keystroke does NOT cause this screen to re-render. The products
  // query is owned by `CatalogProductsBridge` (rendered below), which
  // is the only subtree that subscribes to `searchText`.
  const setSearchText = usePOSSearchStore((s) => s.setSearchText);
  const handleSearchTextChange = useCallback(
    (text: string) => {
      setSearchText(text);
    },
    [setSearchText],
  );

  const cart = useCart();

  // Stable wrapper — must not change when cartItems changes, or every
  // visible ProductRow sees a fresh onToggleUnit prop and re-renders
  // (css-interop then reprocesses the whole catalog). Read the live
  // cartItems through a ref so the closure is stable for the life
  // of the screen.
  const cartItemsRef = useRef(cart.cartItems);
  const toggleUnitRef = useRef(cart.toggleUnit);
  cartItemsRef.current = cart.cartItems;
  toggleUnitRef.current = cart.toggleUnit;

  const handleToggleUnit = useCallback((productId: number) => {
    const items = cartItemsRef.current;
    const idx = items.findIndex((item) => item.product_id === productId);
    if (idx !== -1) toggleUnitRef.current(idx);
  }, []);

  const handleOpenCheckout = useCallback(() => {
    setCheckoutOpen(true);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    setCheckoutOpen(false);
  }, []);

  const handleCloseCustomerPicker = useCallback(() => {
    setShowCustomerPicker(false);
  }, []);

  const memoizedCartLine = useMemo(() => cart.getCartLine, [cart.getCartLine]);

  return (
    <View className="flex-1 bg-paper-200">
      <CatalogProductsBridge
        getCartLine={memoizedCartLine}
        onAdd={cart.addItem}
        onUpdateQuantity={cart.updateQuantity}
        onToggleUnit={handleToggleUnit}
        onPressScan={cart.openScanner}
        pendingAddProductBarcode={cart.pendingAddProductBarcode}
        onPressAddNewProduct={cart.handlePressAddNewProduct}
        onDismissPendingAddProduct={cart.dismissPendingAddProduct}
        onSearchTextChange={handleSearchTextChange}
      />

      {/* Floating Checkout Button */}
      <FloatingCheckoutButton
        itemCount={cart.itemCount}
        total={cart.total}
        onPress={handleOpenCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        visible={checkoutOpen}
        onClose={handleCloseCheckout}
      />

      <CustomerPickerModal
        visible={showCustomerPicker}
        customers={cart.customers}
        paymentType={cart.paymentType}
        onClose={handleCloseCustomerPicker}
        onSelect={(customer) => {
          cart.setCustomer(customer);
          setShowCustomerPicker(false);
        }}
        onSelectOneOffName={(name) => {
          cart.setCustomer(name);
          setShowCustomerPicker(false);
        }}
      />

      <BarcodeScannerModal
        visible={cart.isScannerOpen}
        mode="continuous"
        onClose={cart.closeScanner}
        onScan={cart.handleScannedBarcode}
        lastScanned={cart.lastScanned}
        itemCount={cart.itemCount}
        total={cart.total}
      />
    </View>
  );
}

/**
 * Isolates the products query subscription so the parent POS screen
 * does not re-render on every keystroke. Nothing here reaches into
 * cart state, so this subtree's re-renders are scoped to the catalog
 * (search bar + Fast Lane + FlatList contents).
 */
interface CatalogProductsBridgeProps {
  getCartLine: (productId: number) => import('@/types').NewSaleItem | undefined;
  onAdd: (
    product: import('@/types').Product,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onToggleUnit: (productId: number) => void;
  onPressScan: () => void;
  pendingAddProductBarcode: string | null;
  onPressAddNewProduct: () => void;
  onDismissPendingAddProduct: () => void;
  onSearchTextChange: (text: string) => void;
}

function CatalogProductsBridge(props: CatalogProductsBridgeProps) {
  // Reading the search text here scopes the re-render to the bridge
  // (and below it, the catalog) — the parent screen is unaffected.
  const searchText = usePOSSearchStore((s) => s.searchText);
  const productsQuery = usePaginatedProducts(searchText);
  // `productsQuery.data` is a stable TanStack reference for the same
  // page of results. `.pages.flatMap(...)` returns a new array each
  // call though — without useMemo here, FlatList sees a fresh `data`
  // prop on every render of this bridge and re-renders every visible
  // row, which trips VirtualizedList's slow-update warning during a
  // PK toggle that re-renders the bridge.
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );
  const {
    isLoading: isProductsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = productsQuery;

  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;
  const handleFetchNextPage = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPageRef.current();
    }
  }, [isFetchingNextPage, hasNextPage]);

  const handleRetryFetchNext = useCallback(() => {
    fetchNextPageRef.current();
  }, []);

  return (
    <ProductSearchCatalog
      filteredProducts={products}
      isLoading={isProductsLoading}
      getCartLine={props.getCartLine}
      onAdd={props.onAdd}
      onUpdateQuantity={props.onUpdateQuantity}
      onToggleUnit={props.onToggleUnit}
      onPressScan={props.onPressScan}
      pendingAddProductBarcode={props.pendingAddProductBarcode}
      onPressAddNewProduct={props.onPressAddNewProduct}
      onDismissPendingAddProduct={props.onDismissPendingAddProduct}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onEndReached={handleFetchNextPage}
      onRetryFetchNext={handleRetryFetchNext}
      onSearchTextChange={props.onSearchTextChange}
    />
  );
}