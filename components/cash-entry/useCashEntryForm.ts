import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useCurrentSession, useInsertCashEntry } from '@/hooks';
import { parsePesosInput } from '@/lib/money';
import { CashEntryType } from '@/types/cash.types';

export interface CashEntryFormData {
  type: CashEntryType;
  amount: string;
  notes: string;
}

export interface EntryTypeOption {
  value: CashEntryType;
  label: string;
  sub: string;
  icon: 'minus-circle' | 'arrow-down' | 'plus-circle';
  color: string;
  bg: string;
  border: string;
}

export const ENTRY_TYPES = [
  {
    value: 'expense',
    label: 'Gastos / Bawas (Expense)',
    sub: 'Ice, supplies, store purchases, utilities',
    icon: 'minus-circle',
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger-50',
    border: 'border-semantic-danger-100',
  },
  {
    value: 'owner_drawing',
    label: 'Owner Withdrawal (Draw)',
    sub: 'Taking cash out of the drawer for personal use',
    icon: 'arrow-down',
    color: 'text-cinnamon-500',
    bg: 'bg-cinnamon-50',
    border: 'border-cinnamon-100',
  },
  {
    value: 'owner_addition',
    label: 'Owner Dagdag (Addition)',
    sub: 'Adding extra cash / change to the drawer',
    icon: 'plus-circle',
    color: 'text-sage-600',
    bg: 'bg-sage-50',
    border: 'border-sage-100',
  },
] satisfies EntryTypeOption[];

/**
 * useCashEntryForm — owns the Record Cash Movement screen's form and session state.
 */
export function useCashEntryForm() {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { data: currentSession, isLoading: sessionLoading } =
    useCurrentSession();
  const insertCashEntryMutation = useInsertCashEntry();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CashEntryFormData>({
    mode: 'onChange',
    defaultValues: {
      type: 'expense',
      amount: '',
      notes: '',
    },
  });

  const onSubmit = (data: CashEntryFormData) => {
    if (!currentSession) return;
    try {
      const parsedAmount = parsePesosInput(data.amount);
      insertCashEntryMutation.mutate(
        {
          sessionId: currentSession.id,
          entry: {
            type: data.type,
            amount: parsedAmount,
            notes: data.notes.trim(),
          },
        },
        {
          onSuccess: () => {
            router.back();
          },
        },
      );
    } catch (err) {
      console.error(err);
    }
  };

  return {
    router,
    focusedField,
    setFocusedField,
    currentSession,
    sessionLoading,
    insertCashEntryMutation,
    control,
    handleSubmit,
    errors,
    isValid,
    onSubmit,
  };
}
