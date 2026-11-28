import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { router, useLocalSearchParams } from 'expo-router';
import { NewPayment, Payment } from '@/types';
import { parsePesosInput, tryParsePesosInput } from '@/lib/money';
import { CreditTransaction } from '@/types/credits.types';
import { useCustomer, useCustomerCredits, useInsertPayment } from '@/hooks';
import { getCurrentLocalTimestamp } from '@/utils/timezone';
import { capPayment } from './paymentMath';

/**
 * Form values for the Add Payment screen.
 *
 * `amount` stays as a decimal string (the user's typed value) — see
 * AGENTS.md §1: integer-pesos invariant. We parse it to integer
 * pesos exactly once, inside `submit`, via `parsePesosInput`.
 */
export interface PaymentFormData {
  amount: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  notes: string;
}

/**
 * Additive quick-pay chips — tapping one increments the running
 * payment amount. Tap `+₱100` twice to enter ₱200.
 */
export const QUICK_PAY_PRESETS = [20, 50, 100, 500] as const;
export type QuickPayPreset = (typeof QUICK_PAY_PRESETS)[number];

/**
 * One row of the live FIFO allocation receipt.
 *
 * `applied` is the portion of the credit that this payment will cover
 * once submitted. `remainingAfter` is what the suki still owes on
 * that credit after this payment lands. Both are integer pesos.
 */
export interface AllocationRow {
  credit: CreditTransaction;
  /** Pesos applied to this credit by *this* payment. 0 if untouched. */
  applied: number;
  /** `credit.amount - credit.amount_paid` before this payment. */
  owedBefore: number;
  /** `owedBefore - applied`. The new outstanding on this credit. */
  remainingAfter: number;
  /** Fully covered by this payment (remainingAfter === 0 and applied > 0). */
  fullyCovered: boolean;
  /** Partially covered (0 < remainingAfter < owedBefore). */
  partiallyCovered: boolean;
}

/**
 * useAddPaymentForm — owns the Record Payment screen's form state.
 *
 * Encapsulates react-hook-form setup, quick-pay amount presets,
 * date selection (defaults to today), payment method toggle, and the
 * submit pipeline that posts to `useInsertPayment`. Also computes the
 * live FIFO allocation preview right inside the hook.
 *
 * When entered from Quick Settle (`/utang/add-payment/[id]?creditId=123`),
 * the hook detects `creditId`, overrides the FIFO walk to target only that
 * one credit transaction, pre-fills the amount to its outstanding
 * balance, and surfaces a `pinnedCredit` flag so the UI can call out
 * the focused row.
 */
export function useAddPaymentForm() {
  const { id, creditId } = useLocalSearchParams<{
    id: string;
    /** Optional — present only when entered via Quick Settle. */
    creditId?: string;
  }>();

  const { control, handleSubmit, setValue, reset } = useForm<PaymentFormData>({
    defaultValues: {
      amount: '',
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const amount = useWatch({ control, name: 'amount' });
  const amountTouchedRef = useRef(false);

  // Customer + unpaid credits from the query cache.
  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: allCredits = [], isLoading: creditsLoading } =
    useCustomerCredits(id);

  // FIFO operates oldest-to-newest; the SQL layer already orders by
  // date DESC, so reverse here for the live allocation walk.
  const unpaidCredits = useMemo(
    () =>
      (allCredits as CreditTransaction[]).filter(
        (c: CreditTransaction) => c.status !== 'paid',
      ),
    [allCredits],
  );

  // Resolve the pinned credit (if any) from the URL param. When a
  // Quick Settle link is present we override the FIFO allocation
  // walk below to apply the entire payment to this single credit,
  // mirroring the behavior of the original targeted-payment code path
  // in `database/credits.ts:insertPayment`.
  const pinnedCredit = useMemo(() => {
    if (!creditId) return null;
    const parsedId = Number(creditId);
    if (!Number.isFinite(parsedId)) return null;
    return (
      (unpaidCredits as CreditTransaction[]).find(
        (c: CreditTransaction) => c.id === parsedId,
      ) ?? null
    );
  }, [creditId, unpaidCredits]);

  // Same key as the DB's `ORDER BY date ASC` (a string sort), so the preview matches what gets paid.
  const fifo = useMemo(
    () =>
      [...unpaidCredits].sort((a, b) =>
        a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1,
      ),
    [unpaidCredits],
  );

  // The most this payment can record: one credit in Quick Settle, else the whole balance.
  const owed = pinnedCredit
    ? pinnedCredit.amount - pinnedCredit.amount_paid
    : (customer?.outstanding_balance ?? 0);

  const insertPayment = useInsertPayment();
  // Blocks a second tap before `isPending` re-renders, so one payment is never saved twice.
  const submittingRef = useRef(false);

  // ─── Preset handlers ───────────────────────────────────────────

  /** Add a quick-pay amount to the running payment total. */
  const addAmount = useCallback(
    (increment: number) => {
      amountTouchedRef.current = true;
      const current = tryParsePesosInput(amount);
      const next = current + increment;
      setValue('amount', next.toString());
    },
    [amount, setValue],
  );

  /** Set the payment to exactly what is owed. */
  const payFullBalance = useCallback(() => {
    amountTouchedRef.current = true;
    if (owed > 0) setValue('amount', owed.toString());
  }, [owed, setValue]);

  const payHalfBalance = useCallback(() => {
    amountTouchedRef.current = true;
    if (owed > 0) setValue('amount', Math.floor(owed / 2).toString());
  }, [owed, setValue]);

  /** Reset the payment amount to empty. */
  const clearAmount = useCallback(() => {
    amountTouchedRef.current = true;
    setValue('amount', '');
  }, [setValue]);

  // When Quick Settle brings us in with a pinned credit, pre-fill
  // the amount to that credit's exact outstanding balance — once the
  // credits query has loaded. We only do this if the user hasn't
  // started editing the amount themselves.
  useEffect(() => {
    if (!pinnedCredit) return;
    if (amountTouchedRef.current) return;
    if (amount && amount !== '') return;
    const outstanding = pinnedCredit.amount - pinnedCredit.amount_paid;
    if (outstanding > 0) {
      setValue('amount', outstanding.toString());
    }
  }, [pinnedCredit, amount, setValue]);

  // ─── Live FIFO allocation simulator ────────────────────────────

  /**
   * Mirror of `database/credits.ts:insertPayment`'s allocation walk.
   * When a `pinnedCredit` is present (Quick Settle), the entire
   * payment goes against that single credit. Otherwise we walk the
   * unpaid credits oldest-to-newest (FIFO). The DB will execute the
   * same allocation transactionally on submit, so the receipt must
   * agree.
   */
  const allocation = useMemo(() => {
    let remaining: number = tryParsePesosInput(amount) as number;
    const rows: AllocationRow[] = [];

    if (pinnedCredit) {
      // Single-credit allocation. Show the row even when amount is 0
      // so the cashier sees the focus.
      const owedBefore = pinnedCredit.amount - pinnedCredit.amount_paid;
      const applied = Math.max(0, Math.min(remaining, owedBefore));
      const remainingAfter = Math.max(0, owedBefore - applied);

      rows.push({
        credit: pinnedCredit,
        applied,
        owedBefore,
        remainingAfter,
        fullyCovered: applied > 0 && remainingAfter === 0,
        partiallyCovered: applied > 0 && remainingAfter > 0,
      });

      remaining = Math.max(0, remaining - applied);
      return { rows, unallocated: remaining };
    }

    if (remaining <= 0) {
      return { rows, unallocated: 0 };
    }

    for (const credit of fifo) {
      const owedBefore = credit.amount - credit.amount_paid;
      if (owedBefore <= 0) continue;

      const applied = Math.max(0, Math.min(remaining, owedBefore));
      const remainingAfter = owedBefore - applied;

      rows.push({
        credit,
        applied,
        owedBefore,
        remainingAfter,
        fullyCovered: applied > 0 && remainingAfter === 0,
        partiallyCovered: applied > 0 && remainingAfter > 0,
      });

      remaining -= applied;
      if (remaining <= 0) break;
    }

    return { rows, unallocated: Math.max(0, remaining) };
  }, [amount, fifo, pinnedCredit]);

  // ─── Derived display values ────────────────────────────────────

  const parsedAmount: number = amount
    ? (tryParsePesosInput(amount) as number)
    : 0;
  const outstandingBalance = customer?.outstanding_balance ?? 0;
  const { recorded: recordedAmount, change } = capPayment(parsedAmount, owed);
  const remainingBalance = outstandingBalance - recordedAmount;
  const willClearAll =
    recordedAmount > 0 && remainingBalance <= 0 && outstandingBalance > 0;
  const hasAllocation = allocation.rows.length > 0;
  const isAmountValid = amount !== '' && amount !== '0';
  const oldestCreditDate = fifo[0]?.date ?? null;

  const isSubmitDisabled =
    insertPayment.isPending || !isAmountValid || recordedAmount <= 0;

  // ─── Submit ────────────────────────────────────────────────────

  const submit = handleSubmit((data) => {
    if (submittingRef.current) return;
    const payload: NewPayment = {
      customer_id: Number(id),
      // When Quick Settle pinned a credit, send the targeted
      // allocation; otherwise let the DB do FIFO.
      credit_transaction_id: pinnedCredit?.id ?? null,
      // Never record more than is owed; the excess is change handed back.
      amount: capPayment(parsePesosInput(data.amount), owed).recorded,
      payment_method: data.paymentMethod,
      notes: data.notes?.trim() ?? null,
      date: getCurrentLocalTimestamp(),
    };

    submittingRef.current = true;
    insertPayment.mutate(payload, {
      onError: () => {
        submittingRef.current = false;
      },
    });
  });

  return {
    // Form wiring
    control,
    handleSubmit,
    setValue,
    reset,

    // Watched values
    amount,

    // Local state / handlers
    addAmount,
    payFullBalance,
    payHalfBalance,
    clearAmount,

    // Domain data
    customer,
    unpaidCredits,
    pinnedCredit,
    allocation,

    // Derived
    parsedAmount,
    recordedAmount,
    change,
    owed,
    oldestCreditDate,
    outstandingBalance,
    remainingBalance,
    willClearAll,
    hasAllocation,
    isAmountValid,
    isSubmitDisabled,

    // Query + mutation state
    customerLoading,
    creditsLoading,
    insertPayment,

    // Handlers
    submit,

    // Router (exposed for the back button)
    router,
  };
}

export type PaymentAllocation = ReturnType<
  typeof useAddPaymentForm
>['allocation'];

export type { Payment };
