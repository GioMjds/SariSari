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

/**
 * useAddCustomerForm — owns the Add Customer (New Suki) screen's form state.
 *
 * Encapsulates react-hook-form setup, the watched-values bridge that
 * drive the live Passbook preview, the credit-limit parser that
 * honours the integer-pesos invariant, and the submit pipeline that
 * posts to `useInsertCustomer` (which handles query invalidation +
 * navigation on success).
 *
 * The screen and its components stay presentational; this hook is
 * the single place where business logic lives.
 */
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

  // Watched values — passed to the header for the live Passbook card
  // and to the submit button for the dirty check.
  const name = useWatch({ control, name: 'name' });
  const phone = useWatch({ control, name: 'phone' });
  const address = useWatch({ control, name: 'address' });
  const notes = useWatch({ control, name: 'notes' });
  const creditLimit = useWatch({ control, name: 'credit_limit' });

  // Parse the credit-limit string for display on the Passbook card.
  // `0` means "empty / invalid input", which we render as "No Limit".
  const parsedLimit = creditLimit
    ? tryParsePesosInput(creditLimit)
    : (0 as number);
  const hasLimit = parsedLimit > 0;

  // Dirty check — `isDirty` is only true after the user has touched
  // at least one field. Combined with non-empty values we suppress
  // the unsaved-changes guard for a freshly opened form.
  const hasActualChanges =
    trim(name) !== '' ||
    trim(phone) !== '' ||
    trim(address) !== '' ||
    trim(notes) !== '' ||
    trim(creditLimit) !== '';

  // Confirm-discard guard — fired on hardware back (Android) and the
  // visible back button. If the form has no real input, route back
  // without prompting.
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

  // Wire the Android hardware-back button to the same guard.
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
    // Empty credit limit → undefined (DB column → NULL). A value
    // that parses to 0 (e.g. "0" or "0.00") is treated the same
    // way: no limit set. See AGENTS.md §1: integer-pesos invariant.
    const parsed = data.credit_limit
      ? tryParsePesosInput(data.credit_limit)
      : 0;
    const credit_limit = parsed > 0 ? parsed : undefined;

    const payload: NewCustomer = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      credit_limit,
    };

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