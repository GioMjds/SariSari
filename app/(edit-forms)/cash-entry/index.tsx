import { useState } from 'react';
import {
  View,
  Platform,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useCurrentSession, useInsertCashEntry } from '@/hooks';
import { StyledText } from '@/components/elements';
import { parsePesosInput } from '@/lib/money';
import { CashEntryType } from '@/types/cash.types';

interface CashEntryFormData {
  type: CashEntryType;
  amount: string;
  notes: string;
}

interface EntryType {
  value: CashEntryType;
  label: string;
  sub: string;
  icon: 'minus-circle' | 'arrow-down' | 'plus-circle';
  color: string;
  bg: string;
  border: string;
}

const ENTRY_TYPES = [
  {
    value: 'expense',
    label: 'Gastos / Bawas (Expense)',
    sub: 'Ice, supplies, store purchases, utilities',
    icon: 'minus-circle',
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger-50',
    border: 'border-semantic-danger-100',
  },
  {
    value: 'owner_drawing',
    label: 'Owner Withdrawal (Draw)',
    sub: 'Taking cash out of the drawer for personal use',
    icon: 'arrow-down',
    color: 'text-cinnamon-500',
    bg: 'bg-cinnamon-50',
    border: 'border-cinnamon-100',
  },
  {
    value: 'owner_addition',
    label: 'Owner Dagdag (Addition)',
    sub: 'Adding extra cash / change to the drawer',
    icon: 'plus-circle',
    color: 'text-sage-600',
    bg: 'bg-sage-50',
    border: 'border-sage-100',
  },
] satisfies EntryType[];

export default function CashEntryScreen() {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { data: currentSession, isLoading: sessionLoading } =
    useCurrentSession();
  const insertCashEntryMutation = useInsertCashEntry();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CashEntryFormData>({
    mode: 'onChange',
    defaultValues: {
      type: 'expense',
      amount: '',
      notes: '',
    },
  });

  const onSubmit = (data: CashEntryFormData) => {
    if (!currentSession) return;
    try {
      const parsedAmount = parsePesosInput(data.amount);
      insertCashEntryMutation.mutate(
        {
          sessionId: currentSession.id,
          entry: {
            type: data.type,
            amount: parsedAmount,
            notes: data.notes.trim(),
          },
        },
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
                Record Cash Movement
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
          {/* Card 1: Movement Type */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
            <StyledText
              variant="black"
              className="label-caps text-cinnamon-500 mb-3"
            >
              1. Select Type
            </StyledText>

            <Controller
              control={control}
              name="type"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <View className="space-y-3">
                  {ENTRY_TYPES.map((typeOption) => {
                    const isSelected = value === typeOption.value;
                    return (
                      <Pressable
                        key={typeOption.value}
                        onPress={() => onChange(typeOption.value)}
                        className={`flex-row items-center p-3.5 rounded-xl border-2 active:opacity-70 ${
                          isSelected
                            ? `${typeOption.bg} ${typeOption.border}`
                            : 'bg-paper-100 border-transparent'
                        }`}
                      >
                        <View className="mr-3">
                          <FontAwesome
                            name={typeOption.icon}
                            size={20}
                            className={
                              isSelected ? typeOption.color : 'text-ink-400'
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <StyledText
                            variant="semibold"
                            className={`text-sm ${isSelected ? 'text-ink-900' : 'text-ink-700'}`}
                          >
                            {typeOption.label}
                          </StyledText>
                          <StyledText
                            variant="regular"
                            className="text-ink-400 text-xs mt-0.5"
                          >
                            {typeOption.sub}
                          </StyledText>
                        </View>
                        <View className="ml-2">
                          <View
                            className={`w-5 h-5 rounded-full border items-center justify-center ${
                              isSelected
                                ? 'bg-persimmon-500 border-persimmon-600'
                                : 'border-ink-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <FontAwesome
                                name="check"
                                size={10}
                                color="#FBF7EE"
                              />
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Card 2: Details */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-6">
            <StyledText
              variant="black"
              className="label-caps text-cinnamon-500 mb-3"
            >
              2. Transaction Details
            </StyledText>

            {/* Amount Field */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                Amount (₱) *
              </StyledText>
              <Controller
                control={control}
                name="amount"
                rules={{
                  required: true,
                  validate: (val) =>
                    val.trim().length >= 2 ||
                    'Please enter at least 2 characters.',
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
                      onFocus={() => setFocusedField('amount')}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      keyboardType="decimal-pad"
                      className={`text-ink-900 text-base border rounded-xl pl-9 pr-4 py-3.5 font-stack-sans ${
                        focusedField === 'amount'
                          ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                          : 'bg-paper-100 border-ink-200 shadow-none'
                      }`}
                      placeholderTextColor="#A89F90"
                    />
                  </View>
                )}
              />
              {!!errors.amount && (
                <StyledText className="text-semantic-danger text-xs mt-1.5">
                  {errors.amount.message || 'Please enter a valid amount'}
                </StyledText>
              )}
            </View>

            {/* Notes Field */}
            <View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                Description / Notes *
              </StyledText>
              <Controller
                control={control}
                name="notes"
                rules={{ required: true, minLength: 2 }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="e.g. Bought ice blocks, Paid electric bill, Add coins"
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocusedField('notes')}
                    onBlur={() => {
                      onBlur();
                      setFocusedField(null);
                    }}
                    className={`text-ink-900 text-base border rounded-xl px-4 py-3.5 font-stack-sans ${
                      focusedField === 'notes'
                        ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                        : 'bg-paper-100 border-ink-200 shadow-none'
                    }`}
                    placeholderTextColor="#A89F90"
                  />
                )}
              />
              {errors.notes && (
                <StyledText className="text-semantic-danger text-xs mt-1.5">
                  Please describe this movement (minimum 2 letters)
                </StyledText>
              )}
            </View>
          </View>

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
