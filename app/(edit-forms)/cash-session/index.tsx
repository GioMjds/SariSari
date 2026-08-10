import { View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StyledText } from '@/components/elements';
import {
  useCashSessionState,
  CashSessionHeader,
  OpenSessionView,
  ActiveSessionSummaryCard,
  CloseSessionFormCard,
  CashMovementsList,
} from '@/components/cash-session';
import { Href } from 'expo-router';

export default function CashSessionScreen() {
  const {
    router,
    focusedField,
    setFocusedField,
    currentSession,
    sessionLoading,
    summary,
    summaryLoading,
    entries,
    entriesLoading,
    closeSessionMutation,
    closeControl,
    handleCloseSubmit,
    closeErrors,
    closeIsValid,
    expectedCash,
    variance,
    onCloseSession,
  } = useCashSessionState();

  if (sessionLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StyledText variant="regular" className="text-ink-500">Loading cash drawer...</StyledText>
      </SafeAreaView>
    );
  }

  if (summaryLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StyledText variant="regular" className="text-ink-500">Loading...</StyledText>
      </SafeAreaView>
    );
  }

  if (!currentSession) {
    return <OpenSessionView onBack={() => router.back()} />;
  }

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
        <CashSessionHeader
          title={isOpen ? 'Manage Cash Drawer' : 'Cash Drawer Summary'}
          subtitle={`Session: ${currentSession.businessDate}`}
          onBack={() => router.back()}
        />

        <View className="px-4">
          <ActiveSessionSummaryCard
            currentSession={currentSession}
            summary={summary}
            expectedCash={expectedCash}
            isOpen={isOpen}
          />

          {isOpen && (
            <CloseSessionFormCard
              onRecordMovement={() =>
                router.push('/(edit-forms)/cash-entry' as Href)
              }
              closeControl={closeControl}
              handleCloseSubmit={handleCloseSubmit}
              closeErrors={closeErrors}
              closeIsValid={closeIsValid}
              isPending={closeSessionMutation.isPending}
              variance={variance}
              focusedField={focusedField}
              onFocusField={setFocusedField}
              onCloseSession={onCloseSession}
            />
          )}

          <CashMovementsList
            entries={entries}
            entriesLoading={entriesLoading}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
