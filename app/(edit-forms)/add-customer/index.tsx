import { withProf } from '@/utils/perf';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import {
  AddCustomerHeader,
  AddCustomerFormSheet,
  SubmitButton,
  useAddCustomerForm,
} from '@/components/utang/add-customer';
import { ProductFormHeader } from '@/components/inventory/products/form';
import { useTranslation } from 'react-i18next';
import { KEYBOARD_TOOLBAR_THEME } from '@/lib/theme';

// Height of the sticky save bar, so the focused field scrolls clear of it.
const SAVE_BAR_HEIGHT = 76;
// iOS phone and decimal pads have no return key, so iOS gets a prev/next/done toolbar.
const IS_IOS = Platform.OS === 'ios';
// Caps the form on tablets so labels and fields stay close together.
const CONTENT = 'w-full max-w-[560px] self-center';


function AddCustomer() {
  const form = useAddCustomerForm();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ProductFormHeader title="Add Customer" onBack={router.back} />

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bottomOffset={SAVE_BAR_HEIGHT + 16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: SAVE_BAR_HEIGHT + insets.bottom + 24 }}
      >
        <View className={CONTENT}>
          <AddCustomerHeader control={form.control} />
          <AddCustomerFormSheet control={form.control} setFocus={form.setFocus} />
        </View>
      </KeyboardAwareScrollView>

      {/* On iOS the toolbar owns the keyboard edge; Done reveals the save bar. */}
      <KeyboardStickyView enabled={!IS_IOS} offset={{ opened: insets.bottom }}>
        <View
          className="px-4 pt-3 bg-background border-t border-ink-100"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className={CONTENT}>
            <SubmitButton isPending={form.isPending} onSubmit={form.submit} />
          </View>
        </View>
      </KeyboardStickyView>

      {IS_IOS ? <KeyboardToolbar theme={KEYBOARD_TOOLBAR_THEME} doneText={t('done')} /> : null}
    </SafeAreaView>
  );
}

export default withProf(AddCustomer, 'add-customer/index');
