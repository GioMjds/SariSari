import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller, FieldErrors, UseFormHandleSubmit } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import { formatPesos, parsePesosInput } from '@/lib/money';
import { CloseSessionForm } from './useCashSessionState';

interface CloseSessionFormCardProps {
  onRecordMovement: () => void;
  closeControl: Control<CloseSessionForm>;
  handleCloseSubmit: UseFormHandleSubmit<CloseSessionForm>;
  closeErrors: FieldErrors<CloseSessionForm>;
  closeIsValid: boolean;
  isPending: boolean;
  variance: number | null;
  focusedField: string | null;
  onFocusField: (field: string | null) => void;
  onCloseSession: (data: CloseSessionForm) => void;
}

export function CloseSessionFormCard({
  onRecordMovement,
  closeControl,
  handleCloseSubmit,
  closeErrors,
  closeIsValid,
  isPending,
  variance,
  focusedField,
  onFocusField,
  onCloseSession,
}: CloseSessionFormCardProps) {
  return (
    <>
      {/* Record Manual Movement Trigger */}
      <Pressable
        onPress={onRecordMovement}
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
                onFocus={() => onFocusField('countedCash')}
                onBlur={() => {
                  onBlur();
                  onFocusField(null);
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
        disabled={!closeIsValid || isPending}
        className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
          closeIsValid && !isPending
            ? 'bg-cinnamon-500 active:opacity-70'
            : 'bg-ink-200'
        }`}
      >
        <StyledText
          variant="semibold"
          className={`text-base ${closeIsValid ? 'text-paper-50' : 'text-ink-400'}`}
        >
          {isPending ? 'Closing Drawer...' : 'Close Session & Lock'}
        </StyledText>
      </Pressable>
    </>
  );
}
