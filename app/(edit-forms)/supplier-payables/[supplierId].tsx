import { withProf } from '@/utils/perf';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { Href, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import {
  PAYABLES_COLUMN,
  PayablesError,
  PayablesHeader,
  PayablesSkeleton,
  dueMeta,
} from '@/components/payables/PayablesHeader';
import { deliveryErrorMessage } from '@/components/receiving/deliveryErrors';
import { Modal, Sheet } from '@/components/ui';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import {
  OpeningBalanceExistsError,
  useCreateOpeningBalance,
  useDeleteSupplierPayment,
  useRecordSupplierPayment,
  useHasOpeningBalance,
  useSupplierPayables,
  useSupplierPaymentHistory,
} from '@/hooks/useSupplierPayables';
import { useGetSupplier } from '@/hooks/useSuppliers';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';
import { useToastStore } from '@/stores';
import type { SupplierPayment, SupplierPaymentMethod } from '@/types/supplierPayables.types';
import { addDaysToDate, getTodayDateString } from '@/utils/timezone';

const LIST_ROUTE = '/(edit-forms)/supplier-payables' as Href;
const METHODS: { value: SupplierPaymentMethod; key: string }[] = [
  { value: 'cash', key: 'methodCash' },
  { value: 'bank_transfer', key: 'methodBank' },
  { value: 'other', key: 'methodOther' },
];
const shortDate = (d: string) => format(parseISO(d), 'MMM d');
const toWholePesos = (v: string) => (/^\d+$/.test(v) ? Number(v) : 0);
// shortcut: history renders the latest rows inline; virtualize if owners need years of payments.
const HISTORY_PREVIEW = 20;

function SupplierPayableDetail() {
  const { supplierId = '' } = useLocalSearchParams<{ supplierId: string }>();
  const { t } = useTranslation('receiving');
  const addToast = useToastStore((s) => s.addToast);
  const { runWithPinGuard } = useOwnerPinGuard();

  const supplierQuery = useGetSupplier(supplierId);
  const payablesQuery = useSupplierPayables(supplierId);
  const historyQuery = useSupplierPaymentHistory(supplierId);
  const openingQuery = useHasOpeningBalance(supplierId);
  const recordMutation = useRecordSupplierPayment();
  const deleteMutation = useDeleteSupplierPayment();
  const openingMutation = useCreateOpeningBalance();

  const [sheet, setSheet] = useState<'payment' | 'opening' | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<SupplierPaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [dueDays, setDueDays] = useState('');
  const [reverseTarget, setReverseTarget] = useState<SupplierPayment | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  // Double-tap guard on top of the disabled buttons.
  const busy = useRef(false);
  // PIN prompt queued until the sheet has fully closed, so iOS can present it.
  const afterSheetClosed = useRef<(() => void) | null>(null);

  const supplier = supplierQuery.data ?? null;
  const payables = payablesQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const shownHistory = showAllHistory ? history : history.slice(0, HISTORY_PREVIEW);
  const hasOpening = openingQuery.data === true;
  const owed = payables.reduce((sum, p) => sum + p.amount - p.amountPaid, 0);
  const today = getTodayDateString();
  const amountValue = toWholePesos(amount);
  const amountValid = amountValue > 0 && (sheet !== 'payment' || amountValue <= owed);

  const openSheet = (kind: 'payment' | 'opening') => {
    setAmount(kind === 'payment' && owed > 0 ? String(owed) : '');
    setMethod('cash');
    setNote('');
    setDueDays(supplier?.paymentTermsDays != null ? String(supplier.paymentTermsDays) : '');
    setSheet(kind);
  };

  const toastError = (err: unknown) => {
    const message =
      err instanceof OpeningBalanceExistsError
        ? t('errorOpeningExists')
        : deliveryErrorMessage(err, t);
    addToast({ message, variant: 'danger' });
  };

  // Every write here moves money, so each one waits for the owner PIN.
  const guarded = async (
    actionId: 'supplier_payment' | 'supplier_opening_balance',
    title: string,
    description: string,
    write: () => Promise<unknown>,
    successKey: string,
  ) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await runWithPinGuard({
        actionId,
        title,
        actionDescription: description,
        onApproved: async () => {
          try {
            await write();
            addToast({ message: t(successKey), variant: 'success' });
          } catch (err) {
            toastError(err);
          }
        },
      });
    } finally {
      busy.current = false;
    }
  };

  const handleSave = () => {
    if (!amountValid || !supplier) return;
    const kind = sheet;
    afterSheetClosed.current = () => save(kind, supplier.name);
    setSheet(null);
  };

  const save = (kind: typeof sheet, supplierName: string) => {
    if (kind === 'payment') {
      void guarded(
        'supplier_payment',
        t('paymentPinTitle'),
        t('paymentPinDescription', { amount: formatPesos(amountValue), supplier: supplierName }),
        () => recordMutation.mutateAsync({ supplierId, amount: amountValue, paymentMethod: method, notes: note }),
        'paymentRecordedToast',
      );
    } else {
      const dueDate = dueDays !== '' ? addDaysToDate(new Date().toISOString(), Number(dueDays)) : null;
      void guarded(
        'supplier_opening_balance',
        t('openingPinTitle'),
        t('openingPinDescription', { amount: formatPesos(amountValue), supplier: supplierName }),
        () => openingMutation.mutateAsync({ supplierId, amount: amountValue, dueDate }),
        'openingSavedToast',
      );
    }
  };

  // Confirmed first, because the owner can switch this PIN off and a reversal raises the debt again.
  const confirmReverse = () => {
    const target = reverseTarget;
    setReverseTarget(null);
    if (!target) return;
    void guarded(
      'supplier_payment',
      t('paymentPinTitle'),
      t('reversePinDescription', { amount: formatPesos(target.amount), supplier: supplier?.name ?? '' }),
      () => deleteMutation.mutateAsync(target.id),
      'paymentReversedToast',
    );
  };

  const loading = supplierQuery.isLoading || payablesQuery.isLoading || historyQuery.isLoading;
  // A failed read must never pass as "nothing owed".
  const failed = supplierQuery.isError || payablesQuery.isError || historyQuery.isError;
  const missing = supplierQuery.isSuccess && supplier === null;
  const retry = () => {
    void supplierQuery.refetch();
    void payablesQuery.refetch();
    void historyQuery.refetch();
    void openingQuery.refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <PayablesHeader
        title={supplier?.name ?? t('payablesTitle')}
        subtitle={
          supplier
            ? supplier.paymentTermsDays != null
              ? t('termsLabel', { count: supplier.paymentTermsDays })
              : t('termsNone')
            : null
        }
        fallback={LIST_ROUTE}
      />

      {loading ? (
        <PayablesSkeleton rows={2} />
      ) : failed ? (
        <PayablesError onRetry={retry} />
      ) : missing ? (
        <View className="flex-1 items-center justify-center px-6 gap-2" style={PAYABLES_COLUMN}>
          <SariMascot state="empty" size={88} accessibilityLabel="" />
          <StyledText variant="semibold" className="text-ink-800 text-sm text-center">
            {t('supplierMissing')}
          </StyledText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[{ padding: 16, paddingBottom: 40 }, PAYABLES_COLUMN]}>
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-6">
            <StyledText variant="semibold" className="text-ink-700 text-sm">
              {t('payablesTotalOwed')}
            </StyledText>
            <StyledText
              variant="black"
              className="text-cinnamon-600 text-3xl mt-1"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatPesos(owed)}
            </StyledText>
            <View className="flex-row flex-wrap gap-3 mt-4">
              <ActionButton
                label={t('recordPayment')}
                primary
                disabled={owed <= 0}
                onPress={() => openSheet('payment')}
              />
              {hasOpening ? null : (
                <ActionButton label={t('setOpeningBalance')} onPress={() => openSheet('opening')} />
              )}
            </View>
          </View>

          <SectionHeading text={t('payablesOpenHeading')} />
          {payables.length === 0 ? (
            <EmptyLine text={t('payablesEmpty')} />
          ) : (
            payables.map((p) => {
              const due = dueMeta(p.dueDate, today, t, shortDate);
              const left = p.amount - p.amountPaid;
              const name = p.receiptId !== null ? t('receiptLabel', { id: p.receiptId }) : t('openingBalance');
              return (
                <View
                  key={p.id}
                  className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 flex-row flex-wrap items-center gap-x-3 gap-y-1"
                  accessible
                  accessibilityLabel={`${name}, ${t('amountLeft', { amount: formatPesos(left) })}, ${due.label}`}
                >
                  <View className="flex-1 min-w-[140px]">
                    <StyledText variant="extrabold" className="text-ink-900 text-sm">
                      {name}
                      {p.invoiceNo ? ` · ${p.invoiceNo}` : ''}
                    </StyledText>
                    <StyledText
                      variant="semibold"
                      className={`text-xs mt-0.5 ${due.overdue ? 'text-semantic-danger' : 'text-ink-600'}`}
                    >
                      {due.label}
                    </StyledText>
                  </View>
                  <StyledText
                    variant="black"
                    className="text-ink-900 text-base"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {t('amountLeft', { amount: formatPesos(left) })}
                  </StyledText>
                </View>
              );
            })
          )}

          <SectionHeading text={t('payablesHistoryHeading')} />
          {history.length === 0 ? (
            <EmptyLine text={t('payablesNoHistory')} />
          ) : (
            shownHistory.map((h) => (
              <View
                key={h.id}
                className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 flex-row flex-wrap items-center gap-x-3 gap-y-2"
              >
                <View className="flex-1 min-w-[140px]">
                  <StyledText
                    variant="extrabold"
                    className="text-ink-900 text-sm"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {`${formatPesos(h.amount)} · ${t(METHODS.find((m) => m.value === h.paymentMethod)?.key ?? 'methodOther')}`}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-600 text-xs mt-0.5" numberOfLines={2}>
                    {shortDate(h.businessDate)}
                    {h.notes ? ` · ${h.notes}` : ''}
                  </StyledText>
                </View>
                <Pressable
                  onPress={() => setReverseTarget(h)}
                  disabled={deleteMutation.isPending}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('reversePayment')} ${formatPesos(h.amount)}`}
                  accessibilityState={{ disabled: deleteMutation.isPending }}
                  className="min-h-[44px] px-4 rounded-xl items-center justify-center bg-paper-100 border border-ink-200 active:bg-paper-200"
                >
                  <StyledText variant="extrabold" className="text-sm text-semantic-danger">
                    {t('reversePayment')}
                  </StyledText>
                </Pressable>
              </View>
            ))
          )}
          {history.length > HISTORY_PREVIEW ? (
            <Pressable
              onPress={() => setShowAllHistory((v) => !v)}
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center rounded-xl active:bg-paper-100"
            >
              <StyledText variant="extrabold" className="text-sm text-persimmon-700">
                {showAllHistory ? t('showFewerPayments') : t('showAllPayments', { count: history.length })}
              </StyledText>
            </Pressable>
          ) : null}
        </ScrollView>
      )}

      <Sheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        onClosed={() => {
          const run = afterSheetClosed.current;
          afterSheetClosed.current = null;
          run?.();
        }}
        title={sheet === 'payment' ? t('recordPayment') : t('setOpeningBalance')}
      >
        <View className="gap-y-1">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('paymentAmount')}
          </StyledText>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            accessibilityLabel={t('paymentAmount')}
            className="min-h-[48px] bg-paper-100 border border-ink-200 rounded-xl px-3 text-ink-900 text-base font-stack-sans"
          />
          {sheet === 'payment' && amountValue > owed ? (
            <StyledText variant="semibold" className="text-semantic-danger text-xs" accessibilityLiveRegion="polite">
              {t('errorOverpay', { amount: formatPesos(owed) })}
            </StyledText>
          ) : null}
        </View>

        {sheet === 'payment' ? (
          <>
            <View className="flex-row gap-x-2" accessibilityRole="radiogroup">
              {METHODS.map((m) => {
                const active = method === m.value;
                return (
                  <Pressable
                    key={m.value}
                    onPress={() => setMethod(m.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={t(m.key)}
                    className={`flex-1 min-h-[44px] px-1 rounded-xl items-center justify-center border ${
                      active ? 'bg-cinnamon-500 border-cinnamon-500' : 'bg-paper-100 border-paper-300'
                    }`}
                  >
                    <StyledText
                      variant="semibold"
                      className={`text-xs text-center ${active ? 'text-paper-50' : 'text-ink-700'}`}
                    >
                      {t(m.key)}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('paymentNote')}
              placeholderTextColor={ICON_COLOR.inkMuted}
              accessibilityLabel={t('paymentNote')}
              className="min-h-[48px] bg-paper-100 border border-ink-200 rounded-xl px-3 text-ink-900 text-base font-stack-sans"
            />
          </>
        ) : (
          <View className="gap-y-1.5">
            <View className="flex-row flex-wrap items-center gap-2">
              <StyledText variant="semibold" className="text-ink-900 text-sm">
                {t('dueIn')}
              </StyledText>
              <TextInput
                value={dueDays}
                onChangeText={(v) => setDueDays(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="-"
                placeholderTextColor={ICON_COLOR.inkMuted}
                accessibilityLabel={t('dueInDaysLabel')}
                className="min-w-16 min-h-[44px] bg-paper-100 border border-ink-200 rounded-xl px-3 text-ink-900 text-base text-center font-stack-sans"
              />
              <StyledText variant="semibold" className="text-ink-900 text-sm">
                {t('days')}
              </StyledText>
            </View>
            <StyledText variant="regular" className="text-ink-600 text-xs">
              {dueDays === '' ? t('noDueDateHint') : t('dueInHint')}
            </StyledText>
          </View>
        )}

        <View className="flex-row gap-x-3">
          <ActionButton label={t('cancel')} onPress={() => setSheet(null)} />
          <ActionButton label={t('save')} primary disabled={!amountValid} onPress={handleSave} />
        </View>
      </Sheet>

      <Modal
        visible={reverseTarget !== null}
        onClose={() => setReverseTarget(null)}
        title={t('reverseConfirmTitle')}
        description={t('reverseConfirmBody', {
          amount: formatPesos(reverseTarget?.amount ?? 0),
          supplier: supplier?.name ?? '',
        })}
        variant="danger"
        buttons={[
          { text: t('cancel'), style: 'cancel', onPress: () => setReverseTarget(null) },
          { text: t('reversePayment'), style: 'destructive', onPress: confirmReverse },
        ]}
      />
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  primary = false,
  disabled = false,
  onPress,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  // Light text needs persimmon-600 or darker (DESIGN.md Fill Contrast Rule); disabled keeps ink text readable.
  const surface = disabled
    ? 'bg-paper-300'
    : primary
      ? 'bg-persimmon-600 active:bg-persimmon-700'
      : 'border border-ink-200 bg-paper-100 active:bg-paper-200';
  const text = disabled ? 'text-ink-500' : primary ? 'text-paper-50' : 'text-ink-800';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`flex-1 min-w-[140px] min-h-[48px] px-3 rounded-xl items-center justify-center ${surface}`}
    >
      <StyledText variant="extrabold" className={`text-sm text-center ${text}`}>
        {label}
      </StyledText>
    </Pressable>
  );
}

function SectionHeading({ text }: { text: string }) {
  return (
    <StyledText variant="extrabold" accessibilityRole="header" className="text-ink-900 text-base mb-3">
      {text}
    </StyledText>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <StyledText variant="regular" className="text-ink-600 text-sm mb-6">
      {text}
    </StyledText>
  );
}

export default withProf(SupplierPayableDetail, 'supplier-payables/[supplierId]');
