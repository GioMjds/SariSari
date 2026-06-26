import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { NewPayment, Payment } from '@/types';
import { parsePesosInput, tryParsePesosInput } from '@/lib/money';
import { useCredits } from '@/hooks';
import { CreditTransaction } from '@/types/credits.types';

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
 * useAddPaymentForm — owns the Add Payment screen's form state.
 *
 * Encapsulates react-hook-form setup, the customer + credits queries,
 * the additive quick-pay presets, the live FIFO allocation simulator
 * (mirroring what `insertPayment` will write in the SQLite
 * transaction), and the submit pipeline.
 *
 * The screen and its components stay presentational; this hook is the
 * single place where business logic lives.
 *
 * Quick Settle: when the route is opened with `?creditId=<id>` (from
 * the ⚡ button on a UtangCard), the hook pins the payment to that
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
  const queryClient = useQueryClient();

  const { useCustomer, useCustomerCredits, useInsertPayment } = useCredits();

  const { control, handleSubmit, setValue, watch, reset } =
    useForm<PaymentFormData>({
      defaultValues: {
        amount: '',
        paymentMethod: 'cash',
        notes: '',
      },
    });

  const amount = watch('amount');
  const amountTouchedRef = useRef(false);

  // Customer + unpaid credits from the query cache.
  const { data: customer } = useCustomer(id);
  const { data: allCredits = [] } = useCustomerCredits(id);

  // FIFO operates oldest-to-newest; the SQL layer already orders by
  // date DESC, so reverse here for the live allocation walk.
  const unpaidCredits = useMemo(
    () => allCredits.filter((c) => c.status !== 'paid'),
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
    return unpaidCredits.find((c) => c.id === parsedId) ?? null;
  }, [creditId, unpaidCredits]);

  // Refetch on focus so balances reflect the freshest ledger.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-credits', id] });
    }, [queryClient, id]),
  );

  const insertPayment = useInsertPayment();

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

  /** Set the payment to exactly the suki's outstanding balance. */
  const payFullBalance = useCallback(() => {
    amountTouchedRef.current = true;
    if (!customer) return;
    setValue('amount', customer.outstanding_balance.toString());
  }, [customer, setValue]);

  const payHalfBalance = useCallback(() => {
    amountTouchedRef.current = true;
    if (!customer) return;
    setValue('amount', Math.floor(customer.outstanding_balance / 2).toString());
  }, [customer, setValue]);

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

    // `allCredits` is ordered date DESC; FIFO means oldest first.
    const fifo = [...unpaidCredits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

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
  }, [amount, unpaidCredits, pinnedCredit]);

  // ─── Derived display values ────────────────────────────────────

  const parsedAmount: number = amount
    ? (tryParsePesosInput(amount) as number)
    : 0;
  const outstandingBalance = customer?.outstanding_balance ?? 0;
  const remainingBalance = outstandingBalance - parsedAmount;
  const willClearAll =
    parsedAmount > 0 && remainingBalance <= 0 && outstandingBalance > 0;
  const hasAllocation = allocation.rows.length > 0;
  const isAmountValid = amount !== '' && amount !== '0';

  const isSubmitDisabled =
    insertPayment.isPending || !isAmountValid || parsedAmount <= 0;

  // ─── Submit ────────────────────────────────────────────────────

  const submit = handleSubmit((data) => {
    const payload: NewPayment = {
      customer_id: Number(id),
      // When Quick Settle pinned a credit, send the targeted
      // allocation; otherwise let the DB do FIFO.
      credit_transaction_id: pinnedCredit?.id,
      amount: parsePesosInput(data.amount),
      payment_method: data.paymentMethod,
      notes: data.notes?.trim() || undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
    };

    insertPayment.mutate(payload);
  });

  return {
    // Form wiring
    control,
    handleSubmit,
    setValue,
    watch,
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
    outstandingBalance,
    remainingBalance,
    willClearAll,
    hasAllocation,
    isAmountValid,
    isSubmitDisabled,

    // Mutation state
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
