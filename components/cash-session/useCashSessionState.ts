import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import {
  useCurrentSession,
  useCashSessionSummary,
  useOpenSession,
  useCloseSession,
  useCashEntries,
} from '@/hooks';
import { parsePesosInput, tryParsePesosInput } from '@/lib/money';

export interface OpenSessionForm {
  openingCash: string;
}

export interface CloseSessionForm {
  countedCash: string;
}

/**
 * useCashSessionState — owns the Cash Drawer (Session) screen's state,
 * queries, and reconciliation calculations.
 */
export function useCashSessionState() {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Queries & Mutations
  const { data: currentSession, isLoading: sessionLoading } =
    useCurrentSession();
  const sessionId = currentSession?.id;
  const { data: summary, isLoading: summaryLoading } =
    useCashSessionSummary(sessionId);
  const { data: entries = [], isLoading: entriesLoading } =
    useCashEntries(sessionId);

  const openSessionMutation = useOpenSession();
  const closeSessionMutation = useCloseSession();

  // Forms
  const {
    control: openControl,
    handleSubmit: handleOpenSubmit,
    formState: { errors: openErrors, isValid: openIsValid },
  } = useForm<OpenSessionForm>({
    mode: 'onChange',
    defaultValues: { openingCash: '' },
  });

  const {
    control: closeControl,
    handleSubmit: handleCloseSubmit,
    formState: { errors: closeErrors, isValid: closeIsValid },
  } = useForm<CloseSessionForm>({
    mode: 'onChange',
    defaultValues: { countedCash: '' },
  });

  const countedCashText = useWatch({
    control: closeControl,
    name: 'countedCash',
  });
  const countedCashValue = tryParsePesosInput(countedCashText || '');
  const expectedCash = summary?.expectedCash ?? 0;
  const variance = countedCashText ? countedCashValue - expectedCash : null;

  const onOpenSession = (data: OpenSessionForm) => {
    try {
      const parsed = parsePesosInput(data.openingCash);
      openSessionMutation.mutate(parsed, {
        onSuccess: () => {
          // Success, query invalidation handled in hook
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const onCloseSession = (data: CloseSessionForm) => {
    if (!sessionId) return;
    try {
      const parsed = parsePesosInput(data.countedCash);
      closeSessionMutation.mutate(
        { sessionId, actualCash: parsed },
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
    summary,
    summaryLoading,
    entries,
    entriesLoading,
    openSessionMutation,
    closeSessionMutation,
    openControl,
    handleOpenSubmit,
    openErrors,
    openIsValid,
    closeControl,
    handleCloseSubmit,
    closeErrors,
    closeIsValid,
    countedCashText,
    expectedCash,
    variance,
    onOpenSession,
    onCloseSession,
  };
}
