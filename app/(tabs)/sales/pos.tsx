import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  ProductSearchCatalog,
  CustomerPickerModal,
  FloatingCheckoutButton,
  CheckoutModal,
} from '@/components/sales/pos';
import {
  ParkCartModal,
  ParkedCartsListModal,
  ActiveCartConflictModal,
} from '@/components/sales/pos/parked';
import { BarcodeScannerModal } from '@/components/ui';
import { useCart } from '@/components/sales/pos/useCart';
import { useCartStore, usePOSSearchStore, useToastStore } from '@/stores';
import { usePaginatedProducts, useParkedCarts } from '@/hooks';
import { ParkedCart } from '@/database/parkedCarts';

export default function POSScreen() {
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showParkModal, setShowParkModal] = useState(false);
  const [showParkedListModal, setShowParkedListModal] = useState(false);
  const [targetResumeCart, setTargetResumeCart] = useState<ParkedCart | null>(
    null,
  );
  const [showConflictModal, setShowConflictModal] = useState(false);

  const setSearchText = usePOSSearchStore((s) => s.setSearchText);
  const handleSearchTextChange = useCallback(
    (text: string) => {
      setSearchText(text);
    },
    [setSearchText],
  );

  const cart = useCart();

  const { parkedCarts, parkCart, discardCart, resumeCart } = useParkedCarts();
  const cartItems = useCartStore((s) => s.cartItems);
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const paymentType = useCartStore((s) => s.paymentType);
  const clearCart = useCartStore((s) => s.clearCart);
  const addToast = useToastStore((s) => s.addToast);

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

  const handleParkCurrentCart = useCallback(
    async (label: string): Promise<boolean> => {
      try {
        await parkCart({
          label,
          customer_id:
            selectedCustomer && typeof selectedCustomer === 'object'
              ? selectedCustomer.id
              : null,
          customer_name:
            typeof selectedCustomer === 'string'
              ? selectedCustomer
              : (selectedCustomer?.name ?? null),
          payment_type: paymentType,
          cartItems,
        });
        clearCart();
        setShowParkModal(false);
        addToast({
          variant: 'success',
          message: 'Cart parked successfully.',
        });
        return true;
      } catch (error) {
        addToast({
          variant: 'danger',
          message:
            error instanceof Error ? error.message : 'Failed to park cart.',
        });
        return false;
      }
    },
    [cartItems, selectedCustomer, paymentType, parkCart, clearCart, addToast],
  );

  const handleExecuteResume = useCallback(
    async (cartToResume: ParkedCart) => {
      try {
        const { validatedItems, warnings } = await resumeCart(cartToResume);
        clearCart();

        useCartStore.setState({
          cartItems: validatedItems,
          paymentType: cartToResume.paymentType,
          selectedCustomer: cartToResume.customerName ?? null,
        });

        setShowParkedListModal(false);
        setTargetResumeCart(null);

        if (warnings.length > 0) {
          addToast({ message: warnings.join(' '), variant: 'warning' });
        } else {
          addToast({ message: 'Parked cart resumed.', variant: 'success' });
        }
      } catch {
        addToast({ message: 'Failed to resume cart.', variant: 'danger' });
      }
    },
    [resumeCart, clearCart, addToast],
  );

  const handleSelectResume = useCallback(
    (cartToResume: ParkedCart) => {
      if (cartItems.length > 0) {
        setTargetResumeCart(cartToResume);
        setShowConflictModal(true);
      } else {
        handleExecuteResume(cartToResume);
      }
    },
    [cartItems, handleExecuteResume],
  );

  const handleParkCurrentAndSwitch = useCallback(async () => {
    if (!targetResumeCart) return;
    setShowConflictModal(false);
    const autoLabel = `Cart • ${cartItems.length} items`;
    const success = await handleParkCurrentCart(autoLabel);
    if (success) {
      await handleExecuteResume(targetResumeCart);
    }
  }, [targetResumeCart, cartItems, handleParkCurrentCart, handleExecuteResume]);

  const handleReplaceCurrent = useCallback(async () => {
    if (!targetResumeCart) return;
    setShowConflictModal(false);
    await handleExecuteResume(targetResumeCart);
  }, [targetResumeCart, handleExecuteResume]);

  const handleOpenParkedListModal = useCallback(() => {
    setShowParkedListModal(true);
  }, []);

  const handleOpenParkModal = useCallback(() => {
    setShowParkModal(true);
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
        parkedCartsCount={parkedCarts.length}
        cartItemCount={cartItems.length}
        onPressParkedList={handleOpenParkedListModal}
        onPressParkCurrent={handleOpenParkModal}
      />

      {/* Floating Checkout Button */}
      <FloatingCheckoutButton
        itemCount={cart.itemCount}
        total={cart.total}
        onPress={handleOpenCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal visible={checkoutOpen} onClose={handleCloseCheckout} />

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

      {/* Parked Carts Modals */}
      <ParkCartModal
        visible={showParkModal}
        cartItems={cartItems}
        selectedCustomer={selectedCustomer}
        paymentType={paymentType}
        onClose={() => setShowParkModal(false)}
        onConfirm={handleParkCurrentCart}
      />

      <ParkedCartsListModal
        visible={showParkedListModal}
        parkedCarts={parkedCarts}
        onClose={() => setShowParkedListModal(false)}
        onResume={handleSelectResume}
        onDiscard={(id) => discardCart(id)}
      />

      <ActiveCartConflictModal
        visible={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setTargetResumeCart(null);
        }}
        onParkCurrentAndSwitch={handleParkCurrentAndSwitch}
        onReplaceCurrent={handleReplaceCurrent}
      />
    </View>
  );
}

interface CatalogProductsBridgeProps {
  getCartLine: (productId: number) => import('@/types').NewSaleItem | undefined;
  onAdd: (
    product: import('@/types').Product,
    selectedUnit?: 'retail' | 'wholesale' | undefined,
  ) => 'over_stock' | void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale' | undefined,
  ) => 'over_stock' | void;
  onToggleUnit: (productId: number) => void;
  onPressScan: () => void;
  pendingAddProductBarcode: string | null;
  onPressAddNewProduct: () => void;
  onDismissPendingAddProduct: () => void;
  onSearchTextChange: (text: string) => void;
  parkedCartsCount?: number | undefined;
  cartItemCount?: number | undefined;
  onPressParkedList?: (() => void) | undefined;
  onPressParkCurrent?: (() => void) | undefined;
}

function CatalogProductsBridge(props: CatalogProductsBridgeProps) {
  const searchText = usePOSSearchStore((s) => s.searchText);
  const productsQuery = usePaginatedProducts(searchText);
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
      parkedCartsCount={props.parkedCartsCount}
      cartItemCount={props.cartItemCount}
      onPressParkedList={props.onPressParkedList}
      onPressParkCurrent={props.onPressParkCurrent}
    />
  );
}
