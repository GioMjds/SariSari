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

/** Keep letters and digits only, upper-case, cap at length. */
export const sanitizeCode = (raw: string, length: number): string =>
  raw
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, length);

/**
 * Recovery-code boxes (e.g. ABCD - EFGH). One hidden TextInput owns the
 * keyboard, so paste and autofill work. The boxes only render its value.
 */
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
      style={styles.wrap}
    >
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length }, (_, idx) => {
          const char = value[idx];
          const isCurrent = idx === value.length;
          return (
            <View key={idx} style={styles.cell}>
              {idx > 0 && idx % groupSize === 0 ? (
                <View style={styles.divider} />
              ) : null}
              <View
                style={[
                  styles.box,
                  char !== undefined && styles.boxFilled,
                  isCurrent && !hasError && styles.boxCurrent,
                  hasError && styles.boxError,
                ]}
              >
                <StyledText variant="extrabold" style={styles.char}>
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
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  cell: { flexDirection: 'row', alignItems: 'center' },
  divider: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C3BAB1',
    marginHorizontal: 6,
  },
  box: {
    width: 32,
    height: 48,
    marginHorizontal: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D6CCBF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: '#E85A1F', backgroundColor: '#FFF4EC' },
  boxCurrent: { borderColor: '#E85A1F', borderWidth: 2 },
  boxError: { borderColor: '#C22D2D', backgroundColor: '#FDEEEE' },
  char: { fontSize: 20, color: '#28231D' },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
  },
});
