import { useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useForm } from 'react-hook-form';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NewCustomer } from '@/types';
import { tryParsePesosInput } from '@/lib/money';
import { useInsertCustomer } from '@/hooks';
import { useToastStore } from '@/stores';
import { Alert } from '@/utils';

export interface CustomerFormData {
  name: string;
  /** Digits only; the phone field formats it for display. */
  phone: string;
  address: string;
  notes: string;
  credit_limit: string;
}

/**
 * Owns the add-customer form. It never watches field values itself, so the
 * screen does not re-render per keystroke; preview widgets subscribe directly.
 */
export function useAddCustomerForm() {
  const insertCustomer = useInsertCustomer();
  const addToast = useToastStore((s) => s.addToast);

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { isDirty },
  } = useForm<CustomerFormData>({
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      notes: '',
      credit_limit: '',
    },
  });

  const navigation = useNavigation();
  const saved = useRef(false);

  // Guards every exit path: header back, Android back, and the iOS edge swipe.
  usePreventRemove(isDirty, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert('Discard this suki?', 'The details you typed will be lost.', [
      { text: 'Keep Editing', style: 'cancel', onPress: () => {} },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const submit = handleSubmit(
    (data) => {
      const parsed = data.credit_limit
        ? tryParsePesosInput(data.credit_limit)
        : 0;
      const name = data.name.trim();

      // insertCustomer stores empty strings and a missing limit as NULL.
      const payload: NewCustomer = {
        name,
        phone: data.phone,
        address: data.address.trim(),
        notes: data.notes.trim(),
        ...(parsed > 0 ? { credit_limit: parsed } : {}),
      };

      insertCustomer.mutate(payload, {
        onSuccess: () => {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          addToast({ message: `${name} added to your suki list`, variant: 'success' });
          saved.current = true;
          router.back();
        },
        onError: () => {
          addToast({
            message: 'Could not save this suki. Your details are kept, try again.',
            variant: 'danger',
          });
        },
      });
    },
    (errors) => {
      // RHF focuses the first invalid field; buzz and speech tell the owner why nothing saved.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      const first = Object.values(errors)[0]?.message;
      if (first) AccessibilityInfo.announceForAccessibility(first);
    },
  );

  return {
    control,
    setFocus,
    submit,
    isPending: insertCustomer.isPending,
  };
}
