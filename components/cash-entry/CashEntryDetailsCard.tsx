import React from 'react';
import { View, TextInput } from 'react-native';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import { CashEntryFormData } from './useCashEntryForm';

interface CashEntryDetailsCardProps {
  control: Control<CashEntryFormData>;
  errors: FieldErrors<CashEntryFormData>;
  focusedField: string | null;
  onFocusField: (field: string | null) => void;
}

export function CashEntryDetailsCard({
  control,
  errors,
  focusedField,
  onFocusField,
}: CashEntryDetailsCardProps) {
  return (
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
              val.trim().length >= 2 || 'Please enter at least 2 characters.',
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
                onFocus={() => onFocusField('amount')}
                onBlur={() => {
                  onBlur();
                  onFocusField(null);
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
              onFocus={() => onFocusField('notes')}
              onBlur={() => {
                onBlur();
                onFocusField(null);
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
  );
}
