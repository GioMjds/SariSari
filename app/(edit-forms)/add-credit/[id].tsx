import { View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useMemo } from 'react';
import {
  AddCreditHeader,
  CreditTicketSheet,
  SubmitButton,
  useAddCreditForm,
} from '@/components/utang/add-credit';

export default function AddCreditTransaction() {
  const form = useAddCreditForm();

  /**
   * Filtered product suggestions — runs against the products query
   * cache. Lives here (not in the hook) because the hook is scoped
   * to form state, and the products cache is a query-layer concern.
   */
  const productSuggestions = useMemo(() => {
    const q = form.productQuery.trim().toLowerCase();
    if (!q) return form.products.slice(0, 6);
    return form.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [form.products, form.productQuery]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* KeyboardAwareScrollView replaces the KeyboardAvoidingView +
          ScrollView pair. It auto-scrolls the focused input (notes
          textarea, unit price) into view above the keyboard on both
          platforms. The item picker is rendered as a Modal (see
          ProductPicker), so it's outside this scroll container and
          has its own gesture context — scrolling rows inside it
          doesn't fight the form-sheet's swipe-to-dismiss gesture. */}
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AddCreditHeader
          customer={form.customer}
          onBack={() => form.router.back()}
        />

        <View className="px-4">
          <CreditTicketSheet
            control={form.control}
            quantity={form.quantity}
            amount={form.amount}
            dueDate={form.dueDate}
            productName={form.productName}
            selectedProduct={form.selectedProduct}
            productDropdownOpen={form.productDropdownOpen}
            setProductDropdownOpen={form.setProductDropdownOpen}
            duePreset={form.duePreset}
            productSuggestions={productSuggestions}
            qtyNum={form.qtyNum}
            unitPrice={form.unitPrice}
            total={form.total}
            ticketItems={form.ticketItems}
            itemCount={form.itemCount}
            onProductSelect={form.handleProductSelect}
            onProductNameChange={form.handleProductNameChange}
            onBumpQuantity={form.bumpQuantity}
            onPresetSelect={form.handlePresetSelect}
            onClearProduct={form.clearProduct}
            onAddItemToTicket={form.addCurrentToTicket}
            onRemoveItemFromTicket={form.removeTicketItem}
          />

          <SubmitButton
            disabled={form.isSubmitDisabled}
            isPending={form.insertCredit.isPending}
            total={form.total}
            hasProductName={form.ticketItems.length > 0 || !!form.productName}
            onPress={form.submit}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}