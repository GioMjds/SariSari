import { FC, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { StyledText } from '@/components/elements/StyledText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type PinBoxStatus = 'idle' | 'error' | 'success';

interface Props {
  value: string;
  length?: number;
  /** Show a dot instead of the digit. */
  secure?: boolean;
  status?: PinBoxStatus;
  /** Bump this number to play the error shake. */
  shakeKey?: number;
  /** Highlight the next empty box. Turn off when the pad is disabled. */
  active?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const SHAKE_STEP_MS = 55;

/**
 * Display-only row of PIN boxes. Input comes from PinPad (or any parent),
 * so no system keyboard opens and no layout jumps.
 */
export const PinBoxes: FC<Props> = ({
  value,
  length = 6,
  secure = true,
  status = 'idle',
  shakeKey = 0,
  active = true,
  testID,
  accessibilityLabel,
}) => {
  const shift = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (shakeKey === 0 || reducedMotion) return;
    Animated.sequence([
      Animated.timing(shift, {
        toValue: 10,
        duration: SHAKE_STEP_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shift, {
        toValue: -10,
        duration: SHAKE_STEP_MS * 2,
        useNativeDriver: true,
      }),
      Animated.timing(shift, {
        toValue: 6,
        duration: SHAKE_STEP_MS * 2,
        useNativeDriver: true,
      }),
      Animated.timing(shift, {
        toValue: 0,
        duration: SHAKE_STEP_MS,
        useNativeDriver: true,
      }),
    ]).start();
    // Only a new shakeKey should replay; Reduce Motion toggling must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeKey, shift]);

  return (
    <Animated.View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: `${value.length} of ${length}` }}
      style={[styles.row, { transform: [{ translateX: shift }] }]}
    >
      {Array.from({ length }, (_, idx) => {
        const char = value[idx];
        const filled = char !== undefined;
        const isCurrent = active && idx === value.length && status === 'idle';
        return (
          <View
            key={idx}
            testID={testID ? `${testID}-box-${idx}` : undefined}
            style={[
              styles.box,
              filled && styles.boxFilled,
              isCurrent && styles.boxCurrent,
              status === 'error' && styles.boxError,
              status === 'success' && styles.boxSuccess,
            ]}
          >
            {filled ? (
              secure ? (
                <View
                  style={[
                    styles.dot,
                    status === 'error' && styles.dotError,
                    status === 'success' && styles.dotSuccess,
                  ]}
                />
              ) : (
                <StyledText variant="extrabold" style={styles.digit}>
                  {char}
                </StyledText>
              )
            ) : null}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D6CCBF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: '#E85A1F', backgroundColor: '#FFF4EC' },
  boxCurrent: { borderColor: '#E85A1F', borderWidth: 2 },
  boxError: { borderColor: '#C22D2D', backgroundColor: '#FDEEEE' },
  boxSuccess: { borderColor: '#16A34A', backgroundColor: '#ECFAF1' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E85A1F',
  },
  dotError: { backgroundColor: '#C22D2D' },
  dotSuccess: { backgroundColor: '#16A34A' },
  digit: { fontSize: 24, color: '#28231D' },
});
