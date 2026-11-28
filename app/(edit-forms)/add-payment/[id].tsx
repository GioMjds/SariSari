import { withProf } from '@/utils/perf';
import { Platform, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { KEYBOARD_TOOLBAR_THEME } from '@/lib/theme';
import { ProductFormHeader } from '@/components/inventory/products/form';
import {
  AddPaymentHeader,
  AddPaymentSkeleton,
  AddPaymentLoadError,
  PaymentAmountCard,
  AllocationReceipt,
  PaymentMethodSelector,
  NotesField,
  PaymentSubmitBar,
  PAYMENT_SUBMIT_BAR_HEIGHT,
  useAddPaymentForm,
} from '@/components/utang/add-payment';

const IS_IOS = Platform.OS === 'ios';
const CONTENT = 'w-full max-w-[560px] self-center';

function AddPaymentTransaction() {
  const form = useAddPaymentForm();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('utang');
  const { t: tc } = useTranslation('common');
  const quickSettle = !!form.pinnedCredit;
  const header = (
    <ProductFormHeader
      title={quickSettle ? t('addPaymentTitleQuick') : t('addPaymentTitle')}
      onBack={form.router.back}
    />
  );

  if (!form.customer) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        {header}
        {form.customerLoading ? (
          <View className={CONTENT}>
            <AddPaymentSkeleton />
          </View>
        ) : (
          <AddPaymentLoadError onBack={form.router.back} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {header}

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bottomOffset={PAYMENT_SUBMIT_BAR_HEIGHT + 16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          paddingBottom: PAYMENT_SUBMIT_BAR_HEIGHT + insets.bottom + 24,
        }}
      >
        <View className={`${CONTENT} px-4 pt-4 gap-3`}>
          <AddPaymentHeader
            customer={form.customer}
            openCount={form.unpaidCredits.length}
            oldestDate={form.oldestCreditDate}
          />

          <PaymentAmountCard
            control={form.control}
            owed={form.owed}
            recordedAmount={form.recordedAmount}
            change={form.change}
            remainingBalance={form.remainingBalance}
            willClearAll={form.willClearAll}
            quickSettle={quickSettle}
            onAddAmount={form.addAmount}
            onPayFull={form.payFullBalance}
            onHalfPay={form.payHalfBalance}
            onClear={form.clearAmount}
          />

          <AllocationReceipt
            rows={form.allocation.rows}
            openCount={form.unpaidCredits.length}
            hasAmount={form.recordedAmount > 0}
            quickSettle={quickSettle}
            loading={form.creditsLoading}
            customerName={form.customer.name}
          />

          <PaymentMethodSelector control={form.control} />

          <NotesField control={form.control} />
        </View>
      </KeyboardAwareScrollView>

      {/* On iOS the toolbar owns the keyboard edge; Done reveals the bar. */}
      <KeyboardStickyView enabled={!IS_IOS} offset={{ opened: insets.bottom }}>
        <View
          className="px-4 pt-3 bg-paper-50 border-t border-ink-100"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className={CONTENT}>
            <PaymentSubmitBar
              disabled={form.isSubmitDisabled}
              isPending={form.insertPayment.isPending}
              amount={form.recordedAmount}
              nothingOwed={!form.creditsLoading && form.owed <= 0}
              onPress={form.submit}
            />
          </View>
        </View>
      </KeyboardStickyView>

      {IS_IOS ? (
        <KeyboardToolbar theme={KEYBOARD_TOOLBAR_THEME} doneText={tc('done')} />
      ) : null}
    </SafeAreaView>
  );
}

export default withProf(AddPaymentTransaction, 'add-payment/[id]');
