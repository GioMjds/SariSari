import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { DateRangeSelector } from '@/components/reports';
import { DigitalTransactionModal } from '@/components/services/DigitalTransactionModal';
import { WalletModal } from '@/components/services/WalletModal';
import { SettingsSection } from '@/components/settings/SettingsPrimitives';
import {
  useCreateWallet,
  useDigitalServicesSummary,
  useDigitalTransactions,
  useRecordDigitalTransaction,
  useVoidDigitalTransaction,
  useWallets,
} from '@/hooks/useDigitalServices';
import { formatPesos } from '@/lib/money';
import { useToastStore } from '@/stores';
import type {
  DigitalTransaction,
  DigitalTransactionType,
} from '@/types/digitalServices.types';
import { DateRangeType } from '@/types/reports.types';
import { Alert, getDateRangeFromType } from '@/utils';

const TYPE_LABELS: Record<DigitalTransactionType, string> = {
  cash_in: 'Cash-in',
  cash_out: 'Cash-out',
  eload: 'E-load',
  replenish: 'Float added',
  adjustment: 'Adjustment',
};

const formatTime = (timestamp: string): string => {
  try {
    return format(parseISO(timestamp.replace(' ', 'T')), 'MMM d, h:mm a');
  } catch {
    return timestamp;
  }
};

const signedPesos = (value: number): string =>
  `${value >= 0 ? '+' : '-'}${formatPesos(Math.abs(value))}`;

export default function EServicesLedger() {
  const bottomOffset = useTabBarBottomOffset();
  const addToast = useToastStore((state) => state.addToast);

  const [preset, setPreset] = useState<DateRangeType>('today');
  const [transactionType, setTransactionType] = useState<
    DigitalTransactionType | null
  >(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const { startDate, endDate } = useMemo(() => {
    const range = getDateRangeFromType(preset);
    return {
      startDate: format(range.startDate, 'yyyy-MM-dd'),
      endDate: format(range.endDate, 'yyyy-MM-dd'),
    };
  }, [preset]);

  const walletsQuery = useWallets();
  const transactionsQuery = useDigitalTransactions(startDate, endDate);
  const summaryQuery = useDigitalServicesSummary(startDate, endDate);
  const createWallet = useCreateWallet();
  const recordTransaction = useRecordDigitalTransaction();
  const voidTransaction = useVoidDigitalTransaction();

  const wallets = walletsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const summary = summaryQuery.data;

  const handleVoid = (item: DigitalTransaction) => {
    Alert.alert(
      'Void this transaction?',
      `${TYPE_LABELS[item.transactionType]} of ${formatPesos(item.principalAmount)} will be reversed. The wallet balance and drawer cash are corrected. The record stays in the history.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: () =>
            voidTransaction.mutate(item.id, {
              onError: (e) =>
                addToast({
                  message:
                    e instanceof Error
                      ? e.message
                      : 'Could not void the transaction.',
                  variant: 'danger',
                }),
            }),
        },
      ],
    );
  };

  const openTransaction = (type: DigitalTransactionType) => {
    if (wallets.length === 0) {
      addToast({ message: 'Add a wallet first.', variant: 'danger' });
      return;
    }
    setTransactionType(type);
  };

  const isLoading = walletsQuery.isLoading || transactionsQuery.isLoading;
  const isError = walletsQuery.isError || transactionsQuery.isError;

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title="E-Services"
        subtitle="GCash, Maya at load: float at patong"
        onBack={goBackToMore}
        backAccessibilityLabel="Back to More"
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#623418" />
          </View>
        ) : isError ? (
          <View className="px-5 py-16 items-center">
            <StyledText variant="medium" className="text-ink-700 mb-3">
              Could not load e-services.
            </StyledText>
            <Pressable
              onPress={() => {
                void walletsQuery.refetch();
                void transactionsQuery.refetch();
              }}
              accessibilityRole="button"
              className="px-4 py-3 rounded-xl bg-paper-50 border border-paper-300 active:opacity-70"
            >
              <StyledText variant="semibold" className="text-ink-900">
                Try again
              </StyledText>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="px-5 mt-5">
              <DateRangeSelector
                activeRange={preset}
                onRangeChange={setPreset}
              />
            </View>

            <SettingsSection title="Kita sa serbisyo">
              <View className="px-4 py-4">
                <StyledText
                  variant="extrabold"
                  className="text-3xl text-ink-900"
                >
                  {formatPesos(summary?.serviceIncome ?? 0)}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-sm text-ink-600 mt-1"
                >
                  {summary?.transactionCount ?? 0} transactions. Drawer cash{' '}
                  {signedPesos(summary?.cashDrawerNet ?? 0)}.
                </StyledText>
              </View>
            </SettingsSection>

            <SettingsSection title="Wallets">
              {wallets.length === 0 ? (
                <View className="px-4 py-5">
                  <StyledText variant="regular" className="text-ink-600">
                    No wallets yet. Add GCash, Maya or load to start.
                  </StyledText>
                </View>
              ) : (
                wallets.map((wallet) => (
                  <View
                    key={wallet.id}
                    className="flex-row items-center px-4 py-3"
                    style={{ minHeight: 56 }}
                  >
                    <StyledText
                      variant="semibold"
                      className="flex-1 text-base text-ink-900"
                    >
                      {wallet.name}
                    </StyledText>
                    <StyledText
                      variant="extrabold"
                      className="text-base text-ink-900"
                    >
                      {formatPesos(wallet.currentBalance)}
                    </StyledText>
                  </View>
                ))
              )}
              <Pressable
                onPress={() => setWalletModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Add wallet"
                style={{ minHeight: 48 }}
                className="px-4 justify-center active:opacity-70"
              >
                <StyledText variant="semibold" className="text-persimmon-700">
                  + Add wallet
                </StyledText>
              </Pressable>
            </SettingsSection>

            <View className="px-5 mt-5 flex-row flex-wrap gap-3">
              {(['cash_in', 'cash_out', 'eload'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => openTransaction(type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Record ${TYPE_LABELS[type]}`}
                  style={{ minHeight: 48 }}
                  className="flex-1 items-center justify-center rounded-xl bg-persimmon-600 active:opacity-80"
                >
                  <StyledText variant="extrabold" className="text-paper-50">
                    {TYPE_LABELS[type]}
                  </StyledText>
                </Pressable>
              ))}
            </View>
            <View className="px-5 mt-3 flex-row gap-3">
              {(['replenish', 'adjustment'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => openTransaction(type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Record ${TYPE_LABELS[type]}`}
                  style={{ minHeight: 48 }}
                  className="flex-1 items-center justify-center rounded-xl bg-paper-50 border border-paper-300 active:opacity-70"
                >
                  <StyledText variant="extrabold" className="text-ink-900">
                    {type === 'replenish' ? 'Add float' : 'Adjust balance'}
                  </StyledText>
                </Pressable>
              ))}
            </View>

            <SettingsSection title="History">
              {transactions.length === 0 ? (
                <View className="px-4 py-5">
                  <StyledText variant="regular" className="text-ink-600">
                    No e-service transactions in this period.
                  </StyledText>
                </View>
              ) : (
                transactions.map((item) => {
                  const voided = item.voidedAt !== null;
                  return (
                    <Pressable
                      key={item.id}
                      onLongPress={voided ? undefined : () => handleVoid(item)}
                      accessibilityLabel={`${TYPE_LABELS[item.transactionType]} ${formatPesos(item.principalAmount)}${voided ? ', voided' : ''}`}
                      accessibilityHint={
                        voided ? undefined : 'Long press to void'
                      }
                      style={{ minHeight: 56 }}
                      className="flex-row items-center px-4 py-3 active:opacity-70"
                    >
                      <View className="flex-1 mr-3">
                        <StyledText
                          variant="semibold"
                          className={`text-base ${voided ? 'text-ink-500 line-through' : 'text-ink-900'}`}
                        >
                          {TYPE_LABELS[item.transactionType]} ·{' '}
                          {item.walletName}
                        </StyledText>
                        <StyledText
                          variant="regular"
                          className="text-xs text-ink-600"
                        >
                          {formatTime(item.createdAt)}
                          {item.customerPhone ? ` · ${item.customerPhone}` : ''}
                          {item.referenceNumber
                            ? ` · ${item.referenceNumber}`
                            : ''}
                          {voided ? ' · voided' : ''}
                        </StyledText>
                      </View>
                      <View className="items-end">
                        <StyledText
                          variant="semibold"
                          className="text-base text-ink-900"
                        >
                          {formatPesos(item.principalAmount)}
                        </StyledText>
                        <StyledText
                          variant="regular"
                          className="text-xs text-ink-600"
                        >
                          {item.serviceFee > 0
                            ? `fee ${formatPesos(item.serviceFee)}`
                            : signedPesos(item.walletDelta)}
                        </StyledText>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </SettingsSection>
            {transactions.length > 0 ? (
              <StyledText
                variant="regular"
                className="text-xs text-ink-600 px-6 mt-2"
              >
                Long press a row to void it.
              </StyledText>
            ) : null}
          </>
        )}
      </ScrollView>

      <DigitalTransactionModal
        visible={transactionType !== null}
        wallets={wallets}
        initialType={transactionType ?? 'cash_in'}
        onClose={() => setTransactionType(null)}
        onSubmit={async (data) => {
          await recordTransaction.mutateAsync(data);
        }}
      />
      <WalletModal
        visible={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSubmit={async (data) => {
          await createWallet.mutateAsync(data);
        }}
      />
    </View>
  );
}
