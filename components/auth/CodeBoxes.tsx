import { FC, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements/StyledText';

interface Props {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  groupSize?: number;
  hasError?: boolean;
  autoFocus?: boolean;
  accessibilityLabel: string;
  testID?: string;
}

export const sanitizeCode = (raw: string, length: number): string =>
  raw
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, length);

export const CodeBoxes: FC<Props> = ({
  value,
  onChange,
  length = 8,
  groupSize = 4,
  hasError = false,
  autoFocus = false,
  accessibilityLabel,
  testID,
}) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessible={false}
      className="items-center w-full"
    >
      <View
        className="flex-row justify-center items-center"
        pointerEvents="none"
      >
        {Array.from({ length }, (_, idx) => {
          const char = value[idx];
          const isCurrent = idx === value.length;
          return (
            <View key={idx} className="flex-row items-center">
              {idx > 0 && idx % groupSize === 0 ? (
                <View className="w-2.5 h-0.5 rounded-full bg-paper-400 mx-1" />
              ) : null}
              <View
                className={`w-12 h-16 mx-0.5 rounded-lg border-2 items-center justify-center ${
                  hasError
                    ? 'border-semantic-danger bg-semantic-danger-50'
                    : isCurrent
                      ? 'border-persimmon-500 bg-paper-50'
                      : char !== undefined
                        ? 'border-persimmon-500 bg-persimmon-50'
                        : 'border-paper-300 bg-paper-50'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className="text-xl text-ink-900"
                >
                  {char ?? ''}
                </StyledText>
              </View>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        testID={testID}
        value={value}
        onChangeText={(raw) => onChange(sanitizeCode(raw, length))}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        accessibilityLabel={accessibilityLabel}
        style={{ ...StyleSheet.absoluteFillObject, opacity: 0.01 }}
        caretHidden
      />
    </Pressable>
  );
};
