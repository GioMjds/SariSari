import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  AddPaymentHeader,
  PaymentAmountCard,
  AllocationReceipt,
  PaymentMethodSelector,
  NotesField,
  SubmitButton,
  useAddPaymentForm,
} from '@/components/utang/add-payment';

export default function AddPaymentTransaction() {
  const form = useAddPaymentForm();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AddPaymentHeader
          customer={form.customer}
          onBack={() => form.router.back()}
        />

        <View className="px-4">
          <PaymentAmountCard
            control={form.control}
            amount={form.amount}
            outstandingBalance={form.outstandingBalance}
            parsedAmount={form.parsedAmount}
            remainingBalance={form.remainingBalance}
            willClearAll={form.willClearAll}
            hasOutstanding={form.outstandingBalance > 0}
            onAddAmount={form.addAmount}
            onPayFull={form.payFullBalance}
            onHalfPay={form.payHalfBalance}
            onClear={form.clearAmount}
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <AllocationReceipt
            rows={form.allocation.rows}
            unallocated={form.allocation.unallocated}
            hasAmount={form.parsedAmount > 0}
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <PaymentMethodSelector control={form.control} />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <NotesField control={form.control} />

          <SubmitButton
            disabled={form.isSubmitDisabled}
            isPending={form.insertPayment.isPending}
            amount={form.parsedAmount}
            onPress={form.submit}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
