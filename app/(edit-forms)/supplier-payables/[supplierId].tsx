import { withProf } from '@/utils/perf';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { Href, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { PayablesHeader, dueMeta } from '@/components/payables/PayablesHeader';
import { deliveryErrorMessage } from '@/components/receiving/deliveryErrors';
import { Sheet } from '@/components/ui';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import {
  OpeningBalanceExistsError,
  useCreateOpeningBalance,
  useDeleteSupplierPayment,
  useRecordSupplierPayment,
  useSupplierPayables,
  useSupplierPaymentHistory,
} from '@/hooks/useSupplierPayables';
import { useGetSupplier } from '@/hooks/useSuppliers';
import { formatPesos } from '@/lib/money';
import { useToastStore } from '@/stores';
import type { SupplierPaymentMethod } from '@/types/supplierPayables.types';
import { addDaysToDate, getTodayDateString } from '@/utils/timezone';

const LIST_ROUTE = '/(edit-forms)/supplier-payables' as Href;
const METHODS: { value: SupplierPaymentMethod; key: string }[] = [
  { value: 'cash', key: 'methodCash' },
  { value: 'bank_transfer', key: 'methodBank' },
  { value: 'other', key: 'methodOther' },
];
const shortDate = (d: string) => format(parseISO(d), 'MMM d');
const toWholePesos = (v: string) => (/^\d+$/.test(v) ? Number(v) : 0);

function SupplierPayableDetail() {
  const { supplierId = '' } = useLocalSearchParams<{ supplierId: string }>();
  const { t } = useTranslation('receiving');
  const addToast = useToastStore((s) => s.addToast);
  const { runWithPinGuard } = useOwnerPinGuard();

  const supplierQuery = useGetSupplier(supplierId);
  const payablesQuery = useSupplierPayables(supplierId);
  const historyQuery = useSupplierPaymentHistory(supplierId);
  const recordMutation = useRecordSupplierPayment();
  const deleteMutation = useDeleteSupplierPayment();
  const openingMutation = useCreateOpeningBalance();

  const [sheet, setSheet] = useState<'payment' | 'opening' | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<SupplierPaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [dueDays, setDueDays] = useState('');
  // Double-tap guard on top of the disabled buttons.
  const busy = useRef(false);
  // PIN prompt queued until the sheet has fully closed, so iOS can present it.
  const afterSheetClosed = useRef<(() => void) | null>(null);

  const supplier = supplierQuery.data ?? null;
  const payables = payablesQuery.data ?? [];
  const history = historyQuery.data ?? [];
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
        `Pay ${formatPesos(amountValue)} to ${supplierName}`,
        () => recordMutation.mutateAsync({ supplierId, amount: amountValue, paymentMethod: method, notes: note }),
        'paymentRecordedToast',
      );
    } else {
      const dueDate = dueDays !== '' ? addDaysToDate(new Date().toISOString(), Number(dueDays)) : null;
      void guarded(
        'supplier_opening_balance',
        t('openingPinTitle'),
        `Opening balance ${formatPesos(amountValue)} for ${supplierName}`,
        () => openingMutation.mutateAsync({ supplierId, amount: amountValue, dueDate }),
        'openingSavedToast',
      );
    }
  };

  const handleReverse = (paymentId: number, paymentAmount: number) => {
    void guarded(
      'supplier_payment',
      t('paymentPinTitle'),
      `Reverse ${formatPesos(paymentAmount)} payment to ${supplier?.name ?? ''}`,
      () => deleteMutation.mutateAsync(paymentId),
      'paymentReversedToast',
    );
  };

  const loading = supplierQuery.isLoading || payablesQuery.isLoading;

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
        <View className="flex-1 items-center justify-center">
          <SariMascot state="loading" size={96} accessibilityLabel="Loading" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
            <StyledText variant="black" className="label-caps text-cinnamon-500">
              {t('payablesTotalOwed')}
            </StyledText>
            <StyledText
              variant="black"
              className="text-cinnamon-600 text-3xl mt-1"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatPesos(owed)}
            </StyledText>
            <View className="flex-row gap-x-3 mt-4">
              <ActionButton
                label={t('recordPayment')}
                primary
                disabled={owed <= 0}
                onPress={() => openSheet('payment')}
              />
              <ActionButton label={t('setOpeningBalance')} onPress={() => openSheet('opening')} />
            </View>
          </View>

          <SectionLabel text={t('payablesOpenHeading')} />
          {payables.length === 0 ? (
            <EmptyLine text={t('payablesEmpty')} />
          ) : (
            payables.map((p) => {
              const due = dueMeta(p.dueDate, today, t, shortDate);
              const left = p.amount - p.amountPaid;
              return (
                <View
                  key={p.id}
                  className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper flex-row items-center"
                  accessible
                  accessibilityLabel={`${p.receiptId !== null ? t('receiptLabel', { id: p.receiptId }) : t('openingBalance')}, ${t('amountLeft', { amount: formatPesos(left) })}, ${due.label}`}
                >
                  <View className="flex-1 mr-3">
                    <StyledText variant="extrabold" className="text-ink-900 text-sm">
                      {p.receiptId !== null
                        ? t('receiptLabel', { id: p.receiptId })
                        : t('openingBalance')}
                      {p.invoiceNo ? ` · ${p.invoiceNo}` : ''}
                    </StyledText>
                    <StyledText
                      variant="semibold"
                      className={`text-xs mt-0.5 ${due.overdue ? 'text-semantic-danger' : 'text-ink-500'}`}
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

          <SectionLabel text={t('payablesHistoryHeading')} />
          {history.length === 0 ? (
            <EmptyLine text={t('payablesNoHistory')} />
          ) : (
            history.map((h) => (
              <View
                key={h.id}
                className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper flex-row items-center"
              >
                <View className="flex-1 mr-3">
                  <StyledText
                    variant="extrabold"
                    className="text-ink-900 text-sm"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatPesos(h.amount)} ·{' '}
                    {t(METHODS.find((m) => m.value === h.paymentMethod)?.key ?? 'methodOther')}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-500 text-xs mt-0.5" numberOfLines={1}>
                    {shortDate(h.businessDate)}
                    {h.notes ? ` · ${h.notes}` : ''}
                  </StyledText>
                </View>
                <Pressable
                  onPress={() => handleReverse(h.id, h.amount)}
                  disabled={deleteMutation.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('reversePayment')} ${formatPesos(h.amount)}`}
                  className="px-3 py-2 rounded-xl bg-paper-200 border border-ink-200 active:bg-paper-300"
                >
                  <StyledText variant="semibold" className="text-xs text-semantic-danger">
                    {t('reversePayment')}
                  </StyledText>
                </Pressable>
              </View>
            ))
          )}
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
            className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-3 text-ink-900 text-base font-stack-sans"
          />
          {sheet === 'payment' && amountValue > owed ? (
            <StyledText variant="semibold" className="text-semantic-danger text-xs">
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
                    className={`flex-1 min-h-[44px] rounded-xl items-center justify-center border ${
                      active ? 'bg-cinnamon-500 border-cinnamon-500' : 'bg-paper-100 border-paper-300'
                    }`}
                  >
                    <StyledText variant="semibold" className={`text-xs ${active ? 'text-paper-50' : 'text-ink-700'}`}>
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
              placeholderTextColor="#A89F90"
              accessibilityLabel={t('paymentNote')}
              className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-3 text-ink-900 text-base font-stack-sans"
            />
          </>
        ) : (
          <View className="flex-row items-center gap-x-2">
            <StyledText variant="semibold" className="text-ink-900 text-sm">
              {t('dueIn')}
            </StyledText>
            <TextInput
              value={dueDays}
              onChangeText={(v) => setDueDays(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="-"
              placeholderTextColor="#A89F90"
              accessibilityLabel={t('dueInDaysLabel')}
              className="w-16 bg-paper-100 border border-ink-200 rounded-xl px-3 py-2 text-ink-900 text-base text-center font-stack-sans"
            />
            <StyledText variant="semibold" className="text-ink-900 text-sm">
              {t('days')}
            </StyledText>
          </View>
        )}

        <View className="flex-row gap-x-3">
          <ActionButton label={t('cancel')} onPress={() => setSheet(null)} />
          <ActionButton label={t('save')} primary disabled={!amountValid} onPress={handleSave} />
        </View>
      </Sheet>
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
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
        disabled
          ? 'bg-paper-300'
          : primary
            ? 'bg-persimmon-500'
            : 'border border-ink-200 bg-paper-100'
      }`}
    >
      <StyledText
        variant="extrabold"
        className={`text-sm ${primary || disabled ? 'text-paper-50' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
    </TouchableOpacity>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <StyledText variant="black" accessibilityRole="header" className="label-caps text-cinnamon-500 mb-3 mt-2">
      {text}
    </StyledText>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <StyledText variant="regular" className="text-ink-500 text-xs mb-4">
      {text}
    </StyledText>
  );
}

export default withProf(SupplierPayableDetail, 'supplier-payables/[supplierId]');
