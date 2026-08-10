import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { NewCustomer } from '@/types';
import { tryParsePesosInput } from '@/lib/money';
import { useInsertCustomer } from '@/hooks';
import { Alert } from '@/utils';

export interface CustomerFormData {
  name: string;
  phone: string;
  address: string;
  notes: string;
  credit_limit: string;
}

const trim = (s: string | undefined) => (s ?? '').trim();

export function useAddCustomerForm() {
  const insertCustomer = useInsertCustomer();

  const { control, handleSubmit } = useForm<CustomerFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      notes: '',
      credit_limit: '',
    },
  });

  const name = useWatch({ control, name: 'name' });
  const phone = useWatch({ control, name: 'phone' });
  const address = useWatch({ control, name: 'address' });
  const notes = useWatch({ control, name: 'notes' });
  const creditLimit = useWatch({ control, name: 'credit_limit' });

  const parsedLimit = creditLimit
    ? tryParsePesosInput(creditLimit)
    : (0 as number);
  const hasLimit = parsedLimit > 0;

  const hasActualChanges =
    trim(name) !== '' ||
    trim(phone) !== '' ||
    trim(address) !== '' ||
    trim(notes) !== '' ||
    trim(creditLimit) !== '';

  const confirmDiscard = useCallback(() => {
    if (!hasActualChanges) {
      router.back();
      return;
    }
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: "Don't Leave", style: 'cancel', onPress: () => {} },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  }, [hasActualChanges]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasActualChanges) {
          confirmDiscard();
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [confirmDiscard, hasActualChanges]),
  );

  const submit = handleSubmit((data) => {
    const parsed = data.credit_limit
      ? tryParsePesosInput(data.credit_limit)
      : 0;
    const credit_limit = parsed > 0 ? parsed : undefined;

    const payload = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      credit_limit,
    } as NewCustomer;

    insertCustomer.mutate(payload);
  });

  return {
    // Form wiring (passed through to the ticket sheet / RHF controllers)
    control,
    handleSubmit,

    // Watched values — drive the Passbook preview.
    name,
    phone,
    address,
    notes,
    creditLimit,

    // Derived (for Passbook display).
    hasLimit,
    parsedLimit,

    // Handlers
    submit,
    confirmDiscard,

    // Mutation state
    insertCustomer,

    // Router (exposed for the back button)
    router,
  };
}
