import React from 'react';
import { View, Platform, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller, FieldErrors, UseFormHandleSubmit } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import { parsePesosInput } from '@/lib/money';
import { CashSessionHeader } from './CashSessionHeader';
import { OpenSessionForm } from './useCashSessionState';

interface OpenSessionViewProps {
  onBack: () => void;
  openControl: Control<OpenSessionForm>;
  handleOpenSubmit: UseFormHandleSubmit<OpenSessionForm>;
  openErrors: FieldErrors<OpenSessionForm>;
  openIsValid: boolean;
  isPending: boolean;
  focusedField: string | null;
  onFocusField: (field: string | null) => void;
  onOpenSession: (data: OpenSessionForm) => void;
}

export function OpenSessionView({
  onBack,
  openControl,
  handleOpenSubmit,
  openErrors,
  openIsValid,
  isPending,
  focusedField,
  onFocusField,
  onOpenSession,
}: OpenSessionViewProps) {
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
          title="Open Cash Drawer"
          subtitle="Start Daily Session"
          onBack={onBack}
        />

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
                    onFocus={() => onFocusField('openingCash')}
                    onBlur={() => {
                      onBlur();
                      onFocusField(null);
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
            disabled={!openIsValid || isPending}
            className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
              openIsValid && !isPending
                ? 'bg-persimmon-500 active:opacity-70'
                : 'bg-ink-200'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-base ${openIsValid ? 'text-paper-50' : 'text-ink-400'}`}
            >
              {isPending ? 'Opening Drawer...' : 'Open Drawer'}
            </StyledText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
