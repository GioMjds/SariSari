import { useState } from 'react';
import { View, Platform, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
  useCurrentSession,
  useCashSessionSummary,
  useOpenSession,
  useCloseSession,
  useCashEntries,
} from '@/hooks';
import { StyledText } from '@/components/elements';
import { formatPesos, parsePesosInput, tryParsePesosInput } from '@/lib/money';

interface OpenSessionForm {
  openingCash: string;
}

interface CloseSessionForm {
  countedCash: string;
}

export default function CashSessionScreen() {
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

  if (sessionLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StyledText className="text-ink-500">Loading cash drawer...</StyledText>
      </SafeAreaView>
    );
  }

  if (summaryLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StyledText className="text-ink-500">Loading...</StyledText>
      </SafeAreaView>
    );
  }

  // ─── Case 1: No active session (Open Drawer Form) ──────────────────────────
  if (!currentSession) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <KeyboardAwareScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="px-4 pt-3 pb-4 bg-background">
            <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
              >
                <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
              </Pressable>
              <View className="items-center">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-h2 font-stack-sans-bold"
                >
                  Open Cash Drawer
                </StyledText>
                <StyledText
                  variant="medium"
                  className="label-caps text-ink-400 mt-0.5"
                >
                  Start Daily Session
                </StyledText>
              </View>
              <View className="w-10 h-10" />
            </View>
          </View>

          {/* Info Card */}
          <View className="px-4">
            <View className="rounded-2xl bg-persimmon-50 p-4 mb-4 border border-persimmon-100">
              <View className="flex-row items-center gap-3">
                <View className="bg-persimmon-100 w-10 h-10 rounded-full items-center justify-center">
                  <FontAwesome name="money" size={16} color="#E85A1F" />
                </View>
                <View className="flex-1">
                  <StyledText
                    variant="extrabold"
                    className="text-persimmon-900 text-base"
                  >
                    Daily Drawer Reconciliation
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-persimmon-700 text-xs mt-0.5 leading-relaxed"
                  >
                    Set your starting cash. We will track sales, payments,
                    expenses, and withdrawals to show you expected cash at
                    close.
                  </StyledText>
                </View>
              </View>
            </View>

            {/* Input Card */}
            <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mt-3 mb-6">
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                Starting Cash Amount (₱) *
              </StyledText>
              <Controller
                control={openControl}
                name="openingCash"
                rules={{
                  required: true,
                  validate: (val) => {
                    try {
                      const num = parsePesosInput(val);
                      return num >= 0 || 'Must be positive';
                    } catch {
                      return 'Invalid peso amount';
                    }
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <StyledText className="text-base font-extrabold text-ink-500">
                        ₱
                      </StyledText>
                    </View>
                    <TextInput
                      placeholder="0.00"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setFocusedField('openingCash')}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      keyboardType="decimal-pad"
                      className={`text-ink-900 text-base border rounded-xl pl-9 pr-4 py-3.5 font-stack-sans ${
                        focusedField === 'openingCash'
                          ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                          : 'bg-paper-100 border-ink-200 shadow-none'
                      }`}
                      placeholderTextColor="#A89F90"
                    />
                  </View>
                )}
              />
              {openErrors.openingCash && (
                <StyledText className="text-semantic-danger text-xs mt-1.5">
                  {openErrors.openingCash.message ||
                    'Please enter a valid starting cash amount'}
                </StyledText>
              )}
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleOpenSubmit(onOpenSession)}
              disabled={!openIsValid || openSessionMutation.isPending}
              className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
                openIsValid && !openSessionMutation.isPending
                  ? 'bg-persimmon-500 active:opacity-70'
                  : 'bg-ink-200'
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-base ${openIsValid ? 'text-paper-50' : 'text-ink-400'}`}
              >
                {openSessionMutation.isPending
                  ? 'Opening Drawer...'
                  : 'Open Drawer'}
              </StyledText>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

  // ─── Case 2 & 3: Active Session or Closed Session ─────────────────────────
  const isOpen = currentSession.status === 'open';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-4 pt-3 pb-4 bg-background">
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
            >
              <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
            </Pressable>
            <View className="items-center">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-h2 font-stack-sans-bold"
              >
                {isOpen ? 'Manage Cash Drawer' : 'Cash Drawer Summary'}
              </StyledText>
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mt-0.5"
              >
                Session: {currentSession.businessDate}
              </StyledText>
            </View>
            <View className="w-10 h-10" />
          </View>
        </View>

        <View className="px-4">
          {/* Status Indicator */}
          <View
            className={`rounded-xl border p-3 mb-4 flex-row items-center justify-between ${
              isOpen
                ? 'bg-sage-50 border-sage-100'
                : 'bg-ink-100 border-ink-200'
            }`}
          >
            <View className="flex-row items-center">
              <View
                className={`w-2.5 h-2.5 rounded-full mr-2 ${isOpen ? 'bg-sage-500' : 'bg-ink-400'}`}
              />
              <StyledText
                variant="semibold"
                className={isOpen ? 'text-sage-700' : 'text-ink-700'}
              >
                {isOpen
                  ? 'Drawer is Active / Open'
                  : 'Drawer is Closed & Locked'}
              </StyledText>
            </View>
            <StyledText variant="regular" className="text-ink-400 text-xs">
              Opened:{' '}
              {new Date(currentSession.openingTimestamp).toLocaleTimeString(
                [],
                { hour: '2-digit', minute: '2-digit' },
              )}
            </StyledText>
          </View>

          {/* Cashflow Summary Card */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
            <StyledText
              variant="black"
              className="label-caps text-cinnamon-500 mb-3"
            >
              Cash Summary Breakdown
            </StyledText>

            <View className="space-y-2">
              <CashSummaryRow
                label="Opening Cash"
                value={currentSession.openingCash}
              />
              <CashSummaryRow
                label="Cash Sales"
                value={summary?.cashSales ?? 0}
                isAdd
              />
              <CashSummaryRow
                label="Cash Utang Payments"
                value={summary?.cashUtangPayments ?? 0}
                isAdd
              />
              <CashSummaryRow
                label="Owner Additions"
                value={summary?.ownerAdditions ?? 0}
                isAdd
              />
              <CashSummaryRow
                label="Expenses"
                value={summary?.expenses ?? 0}
                isSubtract
              />
              <CashSummaryRow
                label="Owner Drawings"
                value={summary?.ownerDrawings ?? 0}
                isSubtract
              />

              <View className="h-px border-t border-dashed border-ink-300 my-2" />

              <View className="flex-row justify-between items-center py-1">
                <StyledText
                  variant="extrabold"
                  className="text-ink-950 text-base"
                >
                  Expected Cash
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-ink-950 text-lg"
                >
                  {formatPesos(expectedCash)}
                </StyledText>
              </View>

              {!isOpen && (
                <>
                  <CashSummaryRow
                    label="Physical Counted"
                    value={currentSession.actualCash ?? 0}
                  />
                  <View className="h-px border-t border-dashed border-ink-300 my-2" />
                  <View className="flex-row justify-between items-center py-1">
                    <StyledText
                      variant="extrabold"
                      className="text-ink-950 text-base"
                    >
                      Variance
                    </StyledText>
                    <StyledText
                      variant="extrabold"
                      className={`text-lg ${(currentSession.variance ?? 0) >= 0 ? 'text-sage-600' : 'text-semantic-danger'}`}
                    >
                      {formatPesos(currentSession.variance ?? 0)}
                    </StyledText>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Active Drawer Closing & Recording Actions */}
          {isOpen && (
            <>
              {/* Record Manual Movement Trigger */}
              <Pressable
                onPress={() => router.push('/(edit-forms)/cash-entry' as any)}
                className="w-full bg-paper-50 border border-cinnamon-300 p-4 rounded-xl flex-row justify-center items-center gap-2 mb-6 active:bg-paper-100"
              >
                <FontAwesome name="exchange" size={16} color="#B86B3F" />
                <StyledText
                  variant="semibold"
                  className="text-cinnamon-700 text-sm"
                >
                  Record Cash Movement (Gastos, Withdrawal, Add)
                </StyledText>
              </Pressable>

              {/* Close Drawer Form Card */}
              <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-6">
                <View className="mb-4">
                  <StyledText
                    variant="black"
                    className="label-caps text-persimmon-500"
                  >
                    Close Drawer & Reconcile
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-ink-400 text-xs mt-0.5"
                  >
                    Count your physical cash in the drawer to calculate
                    variance.
                  </StyledText>
                </View>

                <StyledText
                  variant="semibold"
                  className="text-ink-900 text-sm mb-2"
                >
                  Actual Counted Cash (₱) *
                </StyledText>
                <Controller
                  control={closeControl}
                  name="countedCash"
                  rules={{
                    required: true,
                    validate: (val) => {
                      try {
                        const num = parsePesosInput(val);
                        return num >= 0 || 'Must be positive';
                      } catch {
                        return 'Invalid peso amount';
                      }
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative justify-center">
                      <View className="absolute left-4 z-10">
                        <StyledText className="text-base font-extrabold text-ink-500">
                          ₱
                        </StyledText>
                      </View>
                      <TextInput
                        placeholder="0.00"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField('countedCash')}
                        onBlur={() => {
                          onBlur();
                          setFocusedField(null);
                        }}
                        keyboardType="decimal-pad"
                        className={`text-ink-900 text-base border rounded-xl pl-9 pr-4 py-3.5 font-stack-sans ${
                          focusedField === 'countedCash'
                            ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                            : 'bg-paper-100 border-ink-200 shadow-none'
                        }`}
                        placeholderTextColor="#A89F90"
                      />
                    </View>
                  )}
                />
                {closeErrors.countedCash && (
                  <StyledText className="text-semantic-danger text-xs mt-1.5">
                    {closeErrors.countedCash.message ||
                      'Please enter counted physical cash'}
                  </StyledText>
                )}

                {/* On-the-fly Variance display */}
                {variance !== null && (
                  <View className="mt-4 p-3 rounded-xl bg-paper-100 flex-row justify-between items-center">
                    <StyledText
                      variant="semibold"
                      className="text-ink-700 text-sm"
                    >
                      Calculated Variance:
                    </StyledText>
                    <StyledText
                      variant="semibold"
                      className={`text-base ${variance >= 0 ? 'text-sage-600' : 'text-semantic-danger'}`}
                    >
                      {formatPesos(variance)}
                    </StyledText>
                  </View>
                )}
              </View>

              {/* Close session button */}
              <Pressable
                onPress={handleCloseSubmit(onCloseSession)}
                disabled={!closeIsValid || closeSessionMutation.isPending}
                className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
                  closeIsValid && !closeSessionMutation.isPending
                    ? 'bg-cinnamon-500 active:opacity-70'
                    : 'bg-ink-200'
                }`}
              >
                <StyledText
                  variant="semibold"
                  className={`text-base ${closeIsValid ? 'text-paper-50' : 'text-ink-400'}`}
                >
                  {closeSessionMutation.isPending
                    ? 'Closing Drawer...'
                    : 'Close Session & Lock'}
                </StyledText>
              </Pressable>
            </>
          )}

          {/* Log of Manual Entries section */}
          <View className="mt-6">
            <StyledText
              variant="black"
              className="label-caps text-ink-900 mb-3"
            >
              Daily Cash Movements ({entries.length})
            </StyledText>

            {entriesLoading ? (
              <StyledText className="text-xs text-ink-400 py-4">
                Loading entries...
              </StyledText>
            ) : entries.length === 0 ? (
              <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-6 items-center">
                <StyledText variant="regular" className="text-ink-400 text-sm">
                  No manual movements recorded today.
                </StyledText>
              </View>
            ) : (
              <View className="space-y-2">
                {entries.map((item) => (
                  <View
                    key={item.id}
                    className="bg-paper-50 border border-ink-100 rounded-xl p-3.5 flex-row justify-between items-center"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-1.5">
                        <View
                          className={`px-2 py-0.5 rounded-full ${getEntryBadgeColor(item.type)}`}
                        >
                          <StyledText
                            variant="semibold"
                            className="text-xxs uppercase tracking-wider text-white"
                          >
                            {item.type.replace('_', ' ')}
                          </StyledText>
                        </View>
                        <StyledText
                          variant="regular"
                          className="text-ink-400 text-xxs"
                        >
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </StyledText>
                      </View>
                      <StyledText
                        variant="medium"
                        className="text-ink-800 text-sm mt-1"
                      >
                        {item.notes || 'No description'}
                      </StyledText>
                    </View>
                    <StyledText
                      variant="semibold"
                      className={`text-sm ${
                        item.type === 'owner_addition'
                          ? 'text-sage-600'
                          : 'text-semantic-danger'
                      }`}
                    >
                      {item.type === 'owner_addition' ? '+' : '-'}
                      {formatPesos(item.amount)}
                    </StyledText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function CashSummaryRow({
  label,
  value,
  isAdd,
  isSubtract,
}: {
  label: string;
  value: number;
  isAdd?: boolean;
  isSubtract?: boolean;
}) {
  let sign = '';
  let color = 'text-ink-700';

  if (isAdd) {
    sign = '+';
    color = 'text-sage-600';
  } else if (isSubtract) {
    sign = '-';
    color = 'text-semantic-danger';
  }

  return (
    <View className="flex-row justify-between items-center py-1">
      <StyledText variant="regular" className="text-ink-500 text-sm">
        {label}
      </StyledText>
      <StyledText variant="medium" className={`text-sm ${color}`}>
        {sign}
        {formatPesos(value)}
      </StyledText>
    </View>
  );
}

function getEntryBadgeColor(type: string): string {
  switch (type) {
    case 'expense':
      return 'bg-semantic-danger';
    case 'owner_drawing':
      return 'bg-cinnamon-400';
    case 'owner_addition':
      return 'bg-sage-500';
    default:
      return 'bg-ink-400';
  }
}
