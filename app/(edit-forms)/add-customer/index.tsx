import { withProf } from '@/utils/perf';
import { View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import {
  AddCustomerHeader,
  AddCustomerFormSheet,
  SubmitButton,
  useAddCustomerForm,
} from '@/components/utang/add-customer';

// Height of the sticky save bar, so the focused field scrolls clear of it.
const SAVE_BAR_HEIGHT = 76;

function AddCustomer() {
  const form = useAddCustomerForm();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bottomOffset={SAVE_BAR_HEIGHT + 16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: SAVE_BAR_HEIGHT + insets.bottom + 24 }}
      >
        <AddCustomerHeader control={form.control} onBack={form.confirmDiscard} />
        <AddCustomerFormSheet control={form.control} setFocus={form.setFocus} />
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View
          className="px-4 pt-3 bg-background border-t border-ink-100"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <SubmitButton
            control={form.control}
            isPending={form.isPending}
            onSubmit={form.submit}
          />
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

export default withProf(AddCustomer, 'add-customer/index');
