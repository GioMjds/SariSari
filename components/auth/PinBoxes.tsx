import { FC, useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { StyledText } from '@/components/elements/StyledText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type PinBoxStatus = 'idle' | 'error' | 'success';

interface Props {
  value: string;
  length?: number;
  secure?: boolean;
  status?: PinBoxStatus;
  shakeKey?: number;
  active?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const SHAKE_STEP_MS = 55;

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
  }, [shakeKey, shift]);

  return (
    <Animated.View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: `${value.length} of ${length}` }}
      className="flex-row justify-center"
      style={{ transform: [{ translateX: shift }] }}
    >
      {Array.from({ length }, (_, idx) => {
        const char = value[idx];
        const filled = char !== undefined;
        const isCurrent = active && idx === value.length && status === 'idle';

        let boxClass =
          'w-16 h-20 rounded-2xl border-2 items-center justify-center mx-1.5 ';
        if (status === 'error') {
          boxClass += 'border-semantic-danger bg-semantic-danger-50';
        } else if (status === 'success') {
          boxClass += 'border-sage-500 bg-sage-50';
        } else if (isCurrent) {
          boxClass += 'border-persimmon-500 bg-paper-50';
        } else if (filled) {
          boxClass += 'border-persimmon-300 bg-persimmon-50';
        } else {
          boxClass += 'border-paper-300 bg-paper-100';
        }

        return (
          <View
            key={idx}
            testID={testID ? `${testID}-box-${idx}` : undefined}
            className={boxClass}
          >
            {filled ? (
              secure ? (
                <View
                  className={`w-3 h-3 rounded-full ${
                    status === 'error'
                      ? 'bg-semantic-danger'
                      : status === 'success'
                        ? 'bg-sage-500'
                        : 'bg-persimmon-500'
                  }`}
                />
              ) : (
                <StyledText
                  variant="extrabold"
                  className="text-2xl text-ink-900"
                >
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
