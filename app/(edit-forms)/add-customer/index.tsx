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

// Height of the sticky save bar, so the focused field scrolls clear of it.
const SAVE_BAR_HEIGHT = 76;
// iOS phone and decimal pads have no return key, so iOS gets a prev/next/done toolbar.
const IS_IOS = Platform.OS === 'ios';
// Caps the form on tablets so labels and fields stay close together.
const CONTENT = 'w-full max-w-[560px] self-center';

const TOOLBAR_THEME = {
  light: { primary: '#C8460F', disabled: '#A89F90', background: '#F2F0E8', ripple: '#E6E3D8' },
  dark: { primary: '#C8460F', disabled: '#A89F90', background: '#F2F0E8', ripple: '#E6E3D8' },
};

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
        <View className={CONTENT}>
          <AddCustomerHeader control={form.control} onBack={router.back} />
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

      {IS_IOS ? <KeyboardToolbar theme={TOOLBAR_THEME} doneText="Done" /> : null}
    </SafeAreaView>
  );
}

export default withProf(AddCustomer, 'add-customer/index');
