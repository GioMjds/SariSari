import React from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface Props {
  value: number;
  onChange: (next: number) => void;
  current?: number;
  sign?: '+' | '-';
  min?: number;
}

export function QuantityStepper({
  value,
  onChange,
  current,
  sign = '+',
  min = 1,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(value + 1);

  const delta = sign === '+' ? value : -value;
  const newValue = current === undefined ? value : current + delta;
  const signedDelta = current === undefined ? 0 : delta;
  const willGoNegative =
    current !== undefined && sign === '-' && value > current;
  const hidden = value < min;

  return (
    <View className="gap-y-1">
      <View className="flex-row items-center justify-center gap-x-6">
        <Pressable
          onPress={dec}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          className="w-11 h-11 rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
        >
          <FontAwesome name="minus" size={14} color="#0E0C0A" />
        </Pressable>

        <TextInput
          value={String(value)}
          onChangeText={(s) => {
            const n = parseInt(s.replace(/[^0-9]/g, '') || '0', 10);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          keyboardType="number-pad"
          accessibilityLabel="Quantity"
          className="min-w-[64px] text-center text-ink-900 text-lg font-semibold border-b border-paper-300 py-1"
        />

        <Pressable
          onPress={inc}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          className="w-11 h-11 rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
        >
          <FontAwesome name="plus" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      {!hidden && current !== undefined ? (
        <View className="items-center mt-1">
          <StyledText variant="medium" className="text-ink-500 text-[11px]">
            {'CURRENT: '}
            {current}
            {' -> NEW: '}
            <StyledText
              variant="extrabold"
              className={
                willGoNegative
                  ? 'text-rose-700'
                  : signedDelta > 0
                    ? 'text-cinnamon-700'
                    : signedDelta < 0
                      ? 'text-rose-700'
                      : 'text-ink-700'
              }
            >
              {newValue}
            </StyledText>
          </StyledText>
        </View>
      ) : null}

      {willGoNegative ? (
        <StyledText variant="regular" className="text-rose-700 text-xs text-center mt-1">
          Can&apos;t go below zero.
        </StyledText>
      ) : null}
    </View>
  );
}
