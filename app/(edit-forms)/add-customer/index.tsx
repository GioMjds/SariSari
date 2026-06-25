import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  AddCustomerHeader,
  AddCustomerFormSheet,
  useAddCustomerForm,
} from '@/components/utang/add-customer';

export default function AddCustomer() {
  const form = useAddCustomerForm();

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
        <AddCustomerHeader
          name={form.name}
          phone={form.phone}
          hasLimit={form.hasLimit}
          parsedLimit={form.parsedLimit}
          onBack={form.confirmDiscard}
        />

        <View>
          <AddCustomerFormSheet
            control={form.control}
            isPending={form.insertCustomer.isPending}
            onSubmit={form.submit}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
