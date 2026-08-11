import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AddCreditHeader,
  CreditTicketSheet,
  SubmitButton,
  useAddCreditForm,
} from '@/components/utang/add-credit';
import {
  SukiPanel,
  OverrideReasonModal,
} from '@/components/utang/credit-guardrails';
import { StyledText } from '@/components/elements';

export default function AddCreditTransaction() {
  const form = useAddCreditForm();
  const q = form.productQuery.trim().toLowerCase();
  const productSuggestions = !q
    ? form.products.slice(0, 6)
    : form.products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q),
        )
        .slice(0, 6);

  if (!form.customer) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AddCreditHeader
        customer={form.customer}
        onBack={() => form.router.back()}
      />

      <View className="px-4 gap-3">
        {form.creditSummary && (
          <SukiPanel
            summary={form.creditSummary}
            pendingTotal={form.total}
            mode="compact"
            onRequestOverride={() => form.setShowOverrideModal(true)}
          />
        )}

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

      {/* Soft warn modal */}
      <Modal
        visible={form.showSoftWarnModal}
        transparent
        animationType="fade"
        onRequestClose={() => form.setShowSoftWarnModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 gap-4 w-full">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Suki is over limit
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-sm">
              You can continue without an override, or record a reason.
            </StyledText>
            <View className="gap-2">
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.submit();
                }}
                className="bg-ink-200 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-ink-700 text-sm">
                  Continue without override
                </StyledText>
              </Pressable>
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.setShowOverrideModal(true);
                }}
                className="bg-primary-600 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-white text-sm">
                  Record override reason
                </StyledText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OverrideReasonModal
        visible={form.showOverrideModal}
        onClose={() => form.setShowOverrideModal(false)}
        onSubmit={(result) => {
          form.setOverrideReason(result);
          form.setShowOverrideModal(false);
          form.submit();
        }}
      />
    </SafeAreaView>
  );
}
