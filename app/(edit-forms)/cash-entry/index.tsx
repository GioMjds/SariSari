import React from 'react';
import { View, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import {
  useCashEntryForm,
  CashEntryHeader,
  CashEntryTypeCard,
  CashEntryDetailsCard,
} from '@/components/cash-entry';

export default function CashEntryScreen() {
  const {
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
  } = useCashEntryForm();

  if (sessionLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StyledText className="text-ink-500">Loading Cash Drawer...</StyledText>
      </SafeAreaView>
    );
  }

  if (!currentSession || currentSession.status === 'closed') {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center px-6">
        <FontAwesome name="lock" size={48} color="#A89F90" />
        <StyledText
          variant="semibold"
          className="text-ink-800 text-lg mt-4 text-center"
        >
          Drawer is Closed
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-sm mt-2 text-center"
        >
          You must open a cash session before recording movements.
        </StyledText>
        <Pressable
          onPress={() => {
            router.replace('/(edit-forms)/cash-session' as any);
          }}
          className="mt-6 bg-persimmon-500 px-6 py-3 rounded-xl active:opacity-70"
        >
          <StyledText variant="semibold" className="text-white">
            Go to Cash Drawer
          </StyledText>
        </Pressable>
      </SafeAreaView>
    );
  }

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
        <CashEntryHeader
          businessDate={currentSession.businessDate}
          onBack={() => router.back()}
        />

        <View className="px-4">
          <CashEntryTypeCard control={control} />

          <CashEntryDetailsCard
            control={control}
            errors={errors}
            focusedField={focusedField}
            onFocusField={setFocusedField}
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || insertCashEntryMutation.isPending}
            className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
              isValid && !insertCashEntryMutation.isPending
                ? 'bg-persimmon-500 active:opacity-70'
                : 'bg-ink-200'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-base ${isValid ? 'text-paper-50' : 'text-ink-400'}`}
            >
              {insertCashEntryMutation.isPending
                ? 'Saving entry...'
                : 'Save Entry'}
            </StyledText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
